import { integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { EQUIPMENT, type Equipment } from '../domain/equipment';
import { MUSCLE_GROUPS, type MuscleGroup } from '../domain/muscle-groups';

export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  equipment: text('equipment', { enum: EQUIPMENT }).$type<Equipment>().notNull(),
  isBodyweight: integer('is_bodyweight', { mode: 'boolean' }).notNull().default(false),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
  imagePath: text('image_path'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const exerciseMuscleGroups = sqliteTable(
  'exercise_muscle_groups',
  {
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'cascade' }),
    muscleGroup: text('muscle_group', { enum: MUSCLE_GROUPS }).notNull().$type<MuscleGroup>(),
    weight: real('weight').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.exerciseId, table.muscleGroup] }),
  }),
);
