import type { ScheduledSession } from '../domain/scheduled-session';
import type { ScheduledSessionRepo } from '../ports/scheduled-session-repo';

// Trivial passthrough — útil para que la UI nunca importe el adapter, solo
// use-cases. Si mañana hay filtros u ordenaciones derivadas, viven aquí.
export async function listScheduledInRange(
  repo: ScheduledSessionRepo,
  from: Date,
  to: Date,
): Promise<ScheduledSession[]> {
  return repo.listInRange(from, to);
}
