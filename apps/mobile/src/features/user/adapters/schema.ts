import { exercises } from '@/features/exercises/adapters/schema';
import { routines } from '@/features/routines/adapters/schema';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const workouts = sqliteTable('workouts', {
  id: text('id').primaryKey(),
  routineId: text('routine_id').references(() => routines.id, { onDelete: 'set null' }),
  startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
  finishedAt: integer('finished_at', { mode: 'timestamp_ms' }),
  notes: text('notes'),
});

export const sets = sqliteTable('sets', {
  id: text('id').primaryKey(),
  workoutId: text('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseId: text('exercise_id')
    .notNull()
    .references(() => exercises.id, { onDelete: 'restrict' }),
  setNumber: integer('set_number').notNull(),
  weight: real('weight').notNull(),
  reps: integer('reps').notNull(),
  rpe: real('rpe'),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  restSeconds: integer('rest_seconds'),
});
