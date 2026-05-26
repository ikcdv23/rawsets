import { exercises } from '@/features/exercises/adapters/schema';
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const routines = sqliteTable('routines', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const routineExercises = sqliteTable(
  'routine_exercises',
  {
    routineId: text('routine_id')
      .notNull()
      .references(() => routines.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    position: integer('position').notNull(),
    targetSets: integer('target_sets').notNull(),
    notes: text('notes'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.routineId, table.exerciseId] }),
  }),
);
