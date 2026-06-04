import type { SQLiteDatabase } from 'expo-sqlite';

// Nuke total: vacía TODAS las tablas de datos del usuario.
//
// Excepción intencional: NO toca `__drizzle_migrations` (queremos conservar
// el tracking de schema; si lo borráramos, al próximo arranque el migrator
// intentaría re-aplicar migrations sobre tablas ya creadas).
//
// El catálogo de ejercicios se vacía también, pero como `DbProvider` corre
// `seedCuratedExercisesRaw` en cada arranque cuando detecta tabla vacía,
// se repuebla solo. Para el usuario es transparente.
//
// Orden de DELETE: hijos antes que padres por FKs. Aunque varias FKs son
// `ON DELETE CASCADE`, no me fío de mezclarlo con `restrict` — borrar en
// orden explícito hace que nunca peligre.
//
//   sets ──→ workouts, exercises
//   routine_exercises ──→ routines, exercises
//   exercise_muscle_groups ──→ exercises
//   workouts ──→ routines
//   scheduled_sessions ──→ routines
//   routines (huérfano)
//   exercises (huérfano)
//   user_profile (singleton)
//
// La transacción asegura que o se borra TODO o no se borra nada — sin
// estados intermedios si peta a la mitad.
export async function wipeAllData(sqlite: SQLiteDatabase): Promise<void> {
  const tables = [
    'sets',
    'routine_exercises',
    'exercise_muscle_groups',
    'workouts',
    'scheduled_sessions',
    'routines',
    'exercises',
    'user_profile',
  ];

  await sqlite.withTransactionAsync(async () => {
    for (const table of tables) {
      await sqlite.runAsync(`DELETE FROM ${table}`);
    }
  });

  console.log('[wipe-all-data] OK — todas las tablas vaciadas.');
}
