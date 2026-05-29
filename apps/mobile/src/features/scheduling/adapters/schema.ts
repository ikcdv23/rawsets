import { routines } from '@/features/routines/adapters/schema';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Calendario del usuario: qué se planificó cada día.
// Invariante: max 1 sesión/día en Fase 1 (UNIQUE en `date`).
// `routineId` null = descanso planificado. Ver ADR-0004 §4.
export const scheduledSessions = sqliteTable('scheduled_sessions', {
  id: text('id').primaryKey(),
  date: integer('date', { mode: 'timestamp_ms' }).notNull().unique(),
  routineId: text('routine_id').references(() => routines.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});
