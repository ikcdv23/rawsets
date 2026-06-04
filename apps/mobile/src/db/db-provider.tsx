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

// Patrón oficial Expo + Drizzle:
//
//   <SQLiteProvider>      ← abre la DB de forma async-safe (clave para web)
//     <DbReadyGate>       ← envuelve con Drizzle, corre migrations + seed,
//                           bloquea el render hasta que todo está listo
//       <DbContext>       ← expone {db, sqlite} a cualquier descendiente
//         {children}
//
// Por qué dos handles (`db` + `sqlite`):
//
//   `db` (Drizzle) → reads tipadas (.select(), .findById(), joins). Va por la
//     API SYNC de expo-sqlite, que en web envuelve wa-sqlite con busy-loop
//     sobre SharedArrayBuffer. Funciona BIEN para SELECTs sueltos.
//
//   `sqlite` (raw) → writes (INSERT/UPDATE/DELETE) vía `runAsync()`. En web,
//     escribir muchas filas a través del sync wrapper trunca el buffer de
//     respuesta del worker y peta con "Unterminated string in JSON". `runAsync`
//     usa otro canal (no busy-loop) y va siempre fino. En móvil tampoco daña.
//
// Regla práctica: en los adapters, reads con `db`, writes con `sqlite`.

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
  // Duración mínima del splash en ms (UX: branding visible al arrancar).
  // 0 = sin piso de tiempo, abre en cuanto la DB está lista.
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

  // Migrator manual ASYNC — esquiva el sync wrapper colgante de wa-sqlite.
  const [migrationsReady, setMigrationsReady] = useState(false);
  const [migrationsError, setMigrationsError] = useState<Error | null>(null);

  // Timer LOCAL del gate. Sin props que viajen por el árbol — así nada lo
  // puede memoizar mal. Si minimumSplashMs es 0, arranca ya en true.
  const [minimumElapsed, setMinimumElapsed] = useState(minimumSplashMs <= 0);

  useEffect(() => {
    if (minimumSplashMs <= 0) return;
    console.log('[db-gate] splash timer armed for', minimumSplashMs, 'ms');
    const t = setTimeout(() => {
      console.log('[db-gate] splash timer FIRED');
      setMinimumElapsed(true);
    }, minimumSplashMs);
    return () => clearTimeout(t);
  }, [minimumSplashMs]);

  useEffect(() => {
    let cancelled = false;
    console.log('[db-gate] applying migrations...');
    applyMigrationsAsync(sqlite, migrations)
      .then(() => {
        if (cancelled) return;
        console.log('[db-gate] migrations DONE');
        setMigrationsReady(true);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        console.error('[db-gate] migrations FAILED:', err);
        setMigrationsError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [sqlite]);

  useEffect(() => {
    if (!migrationsReady) return;

    const profileRepo = new DrizzleSqliteUserProfileRepo(db, sqlite);
    getOrCreateProfile(profileRepo).catch((err) =>
      console.error('[bootstrap] user profile error:', err),
    );

    seedCuratedExercisesRaw(sqlite)
      .then(({ inserted, skipped }) => {
        if (inserted > 0) console.log(`[seed] +${inserted} ejercicios (${skipped} ya existían)`);
      })
      .catch((err) => console.error('[seed] error:', err));
  }, [migrationsReady, db, sqlite]);

  console.log(
    '[db-gate] render — migrationsReady:',
    migrationsReady,
    'minimumElapsed:',
    minimumElapsed,
  );

  if (migrationsError) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="font-sans-bold text-destructive">Error en migraciones de DB</Text>
        <Text className="mt-2 font-sans text-sm text-muted">{migrationsError.message}</Text>
      </View>
    );
  }
  if (!migrationsReady || !minimumElapsed) {
    console.log(
      '[db-gate] BLOCKED → rendering splash. reason:',
      !migrationsReady ? 'migrations' : 'minimumElapsed',
    );
    return <SplashScreen />;
  }
  console.log('[db-gate] OPEN → rendering children');

  return <DbContext.Provider value={bundle}>{children}</DbContext.Provider>;
}
