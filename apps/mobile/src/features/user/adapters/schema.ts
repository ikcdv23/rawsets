import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { GOALS, type Goal, SEXES, type Sex, UNITS, type Unit } from '../domain/user-profile';

// Singleton: una sola fila con id='me'. La unicidad la garantiza el caso de uso
// al insertar (SQLite no soporta CHECK declarativo de "solo un valor permitido"
// sin trigger). Ver ADR-0005 §1.
export const userProfile = sqliteTable('user_profile', {
  id: text('id').primaryKey(),
  displayName: text('display_name'),
  goal: text('goal', { enum: GOALS }).$type<Goal>().notNull().default('general'),
  unit: text('unit', { enum: UNITS }).$type<Unit>().notNull().default('kg'),
  bodyWeight: real('body_weight'),
  birthDate: integer('birth_date', { mode: 'timestamp_ms' }),
  sex: text('sex', { enum: SEXES }).$type<Sex>(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  // null = onboarding pendiente. Timestamp = fecha en que terminó.
  // Forward-compat: cuando llegue sync, un perfil ya importado vendrá con
  // este campo set y saltará onboarding directamente.
  onboardedAt: integer('onboarded_at', { mode: 'timestamp_ms' }),
});
