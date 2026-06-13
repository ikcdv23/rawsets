import { Result } from '@/shared/result';
import type { ScheduledSessionRepo } from '../ports/scheduled-session-repo';

// Marca un día como descanso PLANIFICADO (distinto de "no asignado").
// Modelado como ScheduledSession con `routineId = null` (ADR-0004 §4).
//
// Diferencia importante:
//  - SIN fila para ese día → día neutral (no rompe racha, no suma).
//  - CON fila `routineId=null` → descanso PLANIFICADO. Si el día llega y no
//    has entrenado, cuenta como cumplido. Si has entrenado igual, bonus.
export async function markRestDay(
  repo: ScheduledSessionRepo,
  date: Date,
  idGenerator: () => string,
): Promise<Result<void, Error>> {
  return repo.upsertOnDate({
    id: idGenerator(),
    date,
    routineId: null,
    createdAt: new Date(),
  });
}

