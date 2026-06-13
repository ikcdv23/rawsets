import type { Db } from '@/db/connection';
import { type Result, toResult } from '@/shared/result';
import type { SQLiteDatabase } from 'expo-sqlite';
import { startOfDay } from '../domain/dates';
import type { ScheduledSession } from '../domain/scheduled-session';
import type { ScheduledSessionRepo } from '../ports/scheduled-session-repo';

// Adapter SQL crudo (mismo patrón que el resto: reads `getAllAsync`, writes
// `runAsync`). El `_db` queda en el constructor para uniformidad — sin uso
// directo hasta que Drizzle resuelva el problema del sync wrapper en web.
export class DrizzleSqliteScheduledSessionRepo implements ScheduledSessionRepo {
  constructor(
    private readonly _db: Db,
    private readonly sqlite: SQLiteDatabase,
  ) {}

  async listInRange(from: Date, to: Date): Promise<Result<ScheduledSession[]>> {
    return toResult(
      (async () => {
        const fromMs = startOfDay(from).getTime();
        const toMs = startOfDay(to).getTime();
        const rows = await this.sqlite.getAllAsync<Row>(
          `SELECT id, date, routine_id AS routineId, created_at AS createdAt
         FROM scheduled_sessions
        WHERE date >= ? AND date < ?
        ORDER BY date ASC`,
          [fromMs, toMs],
        );
        return rows.map(toDomain);
      })(),
    );
  }

  async upsertOnDate(session: ScheduledSession): Promise<Result<void>> {
    // INSERT OR REPLACE sobre el UNIQUE de `date`. Si ya existe la fila del
    // día la sustituye; si no, la crea. SQLite hace esto de forma atómica.
    //
    // ¡Cuidado! `INSERT OR REPLACE` borra la fila vieja y crea una nueva — la
    // `id` cambia. Aceptable porque nadie externo guarda `ScheduledSession.id`
    // (no se usa como FK desde otra tabla).
    return toResult(
      this.sqlite
        .runAsync(
          `INSERT OR REPLACE INTO scheduled_sessions (id, date, routine_id, created_at)
       VALUES (?, ?, ?, ?)`,
          [
            session.id,
            startOfDay(session.date).getTime(),
            session.routineId,
            session.createdAt.getTime(),
          ],
        )
        .then(() => {}),
    );
  }

  async removeByDate(date: Date): Promise<Result<void>> {
    return toResult(
      this.sqlite
        .runAsync('DELETE FROM scheduled_sessions WHERE date = ?', [startOfDay(date).getTime()])
        .then(() => {}),
    );
  }
}

type Row = {
  id: string;
  date: number;
  routineId: string | null;
  createdAt: number;
};

function toDomain(row: Row): ScheduledSession {
  return {
    id: row.id,
    date: new Date(row.date),
    routineId: row.routineId,
    createdAt: new Date(row.createdAt),
  };
}
