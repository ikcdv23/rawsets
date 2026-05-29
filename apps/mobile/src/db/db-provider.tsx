import { DrizzleSqliteExerciseRepo } from '@/features/exercises/adapters/drizzle-sqlite-exercise-repo';
import { seedCuratedExercises } from '@/features/exercises/use-cases/seed-curated-exercises';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { type ReactNode, createContext, useContext, useEffect, useMemo } from 'react';
import { Platform, Text, View } from 'react-native';

import { type Db, migrations, schema } from './connection';

// Patrón oficial recomendado por Expo + Drizzle:
//
//   <SQLiteProvider>      ← abre la DB de forma async-safe (clave para web,
//                           donde el sync wrapper de wa-sqlite hace timeout)
//     <DbReadyGate>       ← envuelve con Drizzle, corre migrations + seed,
//                           bloquea el render hasta que todo está listo
//       <DbContext>       ← expone el `db` tipado a cualquier descendiente
//         {children}
//
// Cualquier componente del árbol puede pedir el `db` con `const db = useDb()`.
// Si llaman `useDb` fuera del provider lanza error explícito en lugar de devolver
// `null` y enmascarar bugs.

const DbContext = createContext<Db | null>(null);

export function useDb(): Db {
  const db = useContext(DbContext);
  if (!db) {
    throw new Error(
      'useDb() debe usarse dentro de <DbProvider>. Asegúrate de que el árbol está envuelto en el provider raíz (típicamente en _layout.tsx).',
    );
  }
  return db;
}

export function DbProvider({ children }: { children: ReactNode }) {
  return (
    <SQLiteProvider databaseName="rawsets.db">
      <DbReadyGate>{children}</DbReadyGate>
    </SQLiteProvider>
  );
}

function DbReadyGate({ children }: { children: ReactNode }) {
  // SQLite handle crudo, ya abierto cuando llegamos aquí (SQLiteProvider lo
  // garantiza). En web es el wrapper de wa-sqlite; en móvil, SQLite nativo.
  const sqlite = useSQLiteContext();

  // Envolvemos con Drizzle UNA vez por sqlite handle. Sin useMemo crearíamos
  // un Drizzle nuevo en cada render → cache de queries perdido y posibles bugs.
  const db = useMemo(() => drizzle(sqlite, { schema }), [sqlite]);

  // Aplica migrations pendientes. En el primer arranque crea las 8 tablas.
  // En arranques posteriores no hace nada (el journal en `meta/` registra
  // qué migrations ya corrieron).
  const { success: migrationsReady, error: migrationsError } = useMigrations(db, migrations);

  // Seed de ejercicios curados — corre tras migrations OK. Idempotente.
  //
  // Web está saltado a propósito: el worker de wa-sqlite tiene buffers
  // internos que truncan respuestas en ciertos patrones de query/insert.
  // Migrations (un único `exec` con DDL) sí funcionan, pero el SELECT+INSERT
  // del seed dispara la lógica que falla con "Unterminated string in JSON".
  // Mobile (SQLite nativo) no tiene este límite y siembra normal.
  // Cuando queramos web con datos reales, hay que migrar las queries a
  // las APIs async puras de expo-sqlite. Deuda explícita.
  useEffect(() => {
    if (!migrationsReady) return;
    if (Platform.OS === 'web') return;
    const repo = new DrizzleSqliteExerciseRepo(db);
    seedCuratedExercises(repo)
      .then(({ inserted, skipped }) => {
        if (inserted > 0) console.log(`[seed] +${inserted} ejercicios (${skipped} ya existían)`);
      })
      .catch((err) => console.error('[seed] error:', err));
  }, [migrationsReady, db]);

  if (migrationsError) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="font-sans-bold text-destructive">Error en migraciones de DB</Text>
        <Text className="mt-2 font-sans text-sm text-muted">{migrationsError.message}</Text>
      </View>
    );
  }
  if (!migrationsReady) return null;

  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}
