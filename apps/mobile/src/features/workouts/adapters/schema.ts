import { exercises } from '@/features/exercises/adapters/schema';
import { routines } from '@/features/routines/adapters/schema';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Schema de workouts/.
//
// Diseño 2 tablas (no 3) — `position` y `setNumber` en sets reconstruyen
// la jerarquía exercise→set sin necesitar una tabla intermedia. Si Fase 2
// añade metadata por ejercicio (notas específicas, descanso configurable),
// extraemos `workout_exercises` sin romper compat.
//
// Políticas ON DELETE:
//   workout.routineId → SET NULL   (la rutina puede borrarse; el histórico
//                                    debe sobrevivir como inmutable)
//   set.workoutId     → CASCADE    (sin workout no tiene sentido el set)
//   set.exerciseId    → RESTRICT   (el catálogo se protege de borrados
//                                    si hay sets que apuntan a él)
//
// Indexes en los campos de query frecuentes — los explico en cada tabla.

// Header de la sesión. Sin datos de sets aquí.
export const workouts = sqliteTable(
  'workouts',
  {
    id: text('id').primaryKey(),
    // Null si fue entreno libre (sin rutina como base).
    routineId: text('routine_id').references(() => routines.id, { onDelete: 'set null' }),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
    // Null mientras está en curso. Esto soporta la feature de "retomar
    // entreno tras cerrar app": al reabrir, si hay un workout con
    // finishedAt=null, restauramos al active session context.
    finishedAt: integer('finished_at', { mode: 'timestamp_ms' }),
    // Comentario libre del usuario sobre la sesión ("me sentía a tope",
    // "molestia en hombro derecho", etc.). Útil para revisar histórico.
    notes: text('notes'),
  },
  (table) => ({
    // Range scans temporales: "últimos 14 días", "este mes", etc.
    // Sin este índice, las queries del radar harían full table scan.
    startedAtIdx: index('workouts_started_at_idx').on(table.startedAt),
  }),
);

// Cada serie logueada. PK sintético — `id` text en vez de composite
// (workoutId+exerciseId+setNumber) porque simplifica updates puntuales
// y futuras renumeraciones sin reescribir FKs.
export const sets = sqliteTable(
  'sets',
  {
    id: text('id').primaryKey(),
    workoutId: text('workout_id')
      .notNull()
      .references(() => workouts.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    // Orden del EJERCICIO dentro del workout. Todos los sets del press
    // banca comparten position=1 si fue el primer ejercicio. Sin esto no
    // podemos reconstruir el orden al recargar (sólo inferirlo del
    // order-by completedAt, frágil).
    position: integer('position').notNull(),
    // Orden de la SERIE dentro del ejercicio (1, 2, 3, 4...).
    setNumber: integer('set_number').notNull(),
    weight: real('weight').notNull(),
    reps: integer('reps').notNull(),
    // Marca de completado. Necesario para "retomar entreno" — guardamos
    // sets planificados aún no hechos con done=false; el sheet los recupera.
    // SQLite no tiene boolean nativo; Drizzle lo mapea integer 0/1 ↔ boolean TS.
    done: integer('done', { mode: 'boolean' }).notNull(),
    // Timestamp del momento en que se marcó done. Null si no done.
    // Habilita analytics tipo "tiempo medio entre series" en Fase 2.
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
    // Rate of Perceived Exertion (1-10). Opcional — el usuario puede
    // anotarla tras la serie. Métrica clave para programación inteligente.
    rpe: real('rpe'),
    // Descanso real tomado tras esta serie (segundos). Mejora con timer
    // automático en Fase 2.
    restSeconds: integer('rest_seconds'),
  },
  (table) => ({
    // "Dame todos los sets de este workout" — la query más frecuente,
    // se ejecuta al abrir el sheet, al ver el histórico, al cerrar el
    // entreno. Sin índice es full scan de toda la tabla.
    workoutIdx: index('sets_workout_idx').on(table.workoutId),
    // "Histórico / PRs de este ejercicio" — query del futuro stats screen.
    exerciseIdx: index('sets_exercise_idx').on(table.exerciseId),
  }),
);
