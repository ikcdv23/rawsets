import { SplashScreen } from '@/components/ui/splash-screen';
import { seedCuratedExercisesRaw } from '@/features/exercises/use-cases/seed-curated-exercises-raw';
import { DrizzleSqliteUserProfileRepo } from '@/features/user/adapters/drizzle-sqlite-user-profile-repo';
import { getOrCreateProfile } from '@/features/user/use-cases/get-or-create-profile';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { type SQLiteDatabase, SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { applyMigrationsAsync } from './apply-migrations-async';
import { type Db, migrations, schema } from './connection';

export type DbBundle = { db: Db; sqlite: SQLiteDatabase };

const DbContext = createContext<DbBundle | null>(null);

export function useDb(): DbBundle {
  const bundle = useContext(DbContext);
  if (!bundle) {
    throw new Error(
      'useDb() debe usarse dentro de <DbProvider>. Asegúrate de que el árbol está envuelto en el provider raíz (típicamente en _layout.tsx).',
    );
  }
  return bundle;
}

export type DbProviderProps = {
  children: ReactNode;
  minimumSplashMs?: number;
};

export function DbProvider({ children, minimumSplashMs = 0 }: DbProviderProps) {
  return (
    <SQLiteProvider databaseName="rawsets.db">
      <DbReadyGate minimumSplashMs={minimumSplashMs}>{children}</DbReadyGate>
    </SQLiteProvider>
  );
}

function DbReadyGate({
  children,
  minimumSplashMs,
}: {
  children: ReactNode;
  minimumSplashMs: number;
}) {
  const sqlite = useSQLiteContext();
  const db = useMemo(() => drizzle(sqlite, { schema }), [sqlite]);
  const bundle = useMemo<DbBundle>(() => ({ db, sqlite }), [db, sqlite]);

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [minimumElapsed, setMinimumElapsed] = useState(minimumSplashMs <= 0);

  useEffect(() => {
    if (minimumSplashMs <= 0) return;
    const t = setTimeout(() => setMinimumElapsed(true), minimumSplashMs);
    return () => clearTimeout(t);
  }, [minimumSplashMs]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        console.log('[db-gate] 1/3 applying migrations...');
        await applyMigrationsAsync(sqlite, migrations);
        if (cancelled) return;

        console.log('[db-gate] 2/3 initializing profile...');
        const profileRepo = new DrizzleSqliteUserProfileRepo(db, sqlite);
        const profileRes = await getOrCreateProfile(profileRepo);
        if (cancelled) return;
        if (!profileRes.ok) throw profileRes.error;

        console.log('[db-gate] 3/3 seeding exercises...');
        const seedRes = await seedCuratedExercisesRaw(sqlite);
        if (cancelled) return;
        if (seedRes.inserted > 0) {
          console.log(`[db-gate] seed OK: +${seedRes.inserted} exercises`);
        }

        console.log('[db-gate] bootstrap complete.');
        setIsReady(true);
      } catch (e) {
        if (cancelled) return;
        console.error('[db-gate] bootstrap FAILED:', e);
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [sqlite, db]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="font-sans-bold text-destructive text-lg">Error crítico de inicio</Text>
        <Text className="mt-2 text-center font-sans text-sm text-muted">{error.message}</Text>
      </View>
    );
  }

  if (!isReady || !minimumElapsed) {
    return <SplashScreen />;
  }

  return <DbContext.Provider value={bundle}>{children}</DbContext.Provider>;
}
