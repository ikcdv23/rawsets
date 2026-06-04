import type { ScheduledSession } from '../domain/scheduled-session';

// Port del repositorio de calendario.
//
// `upsertOnDate` reemplaza atomicamente la sesión del día. Es upsert y NO
// "update" porque la lógica de "tap día sin sesión → asignar rutina" debería
// ser idempotente sin checks previos. SQLite lo hace con INSERT OR REPLACE
// sobre el UNIQUE constraint de `date`.
export type ScheduledSessionRepo = {
  // Devuelve sesiones cuyo `date` cae en [from, to). End-exclusivo para que
  // calcular un mes/semana/etc no requiera trampas con milisegundos.
  listInRange(from: Date, to: Date): Promise<ScheduledSession[]>;
  // Atomicamente: si existe sesión en ese día, la reemplaza; si no, la crea.
  upsertOnDate(session: ScheduledSession): Promise<void>;
  // Borra la sesión del día indicado. Idempotente — no error si no existía.
  removeByDate(date: Date): Promise<void>;
};
