import { type Result } from '@/shared/result';
import type { ScheduledSessionRepo } from '../ports/scheduled-session-repo';

// Quita la sesión planificada de un día. Tras esto, el día queda neutral
// (no rompe ni suma a la racha). Idempotente: borrar día sin fila es OK.
export async function unscheduleDay(
  repo: ScheduledSessionRepo,
  date: Date,
): Promise<Result<void>> {
  return repo.removeByDate(date);
}
