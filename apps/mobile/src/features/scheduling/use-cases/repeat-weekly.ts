import { Result, ok } from '@/shared/result';
import { addDays } from '../domain/dates';
import type { ScheduledSession } from '../domain/scheduled-session';
import type { ScheduledSessionRepo } from '../ports/scheduled-session-repo';

// Duplica la asignación de un día durante las próximas N semanas (mismo día
// de la semana). Útil para el toggle "Repetir cada semana" del sheet de asignar.
//
// La sesión origen debe existir (rutina o descanso). Si no existe, error.
// Reemplaza lo que hubiera en los días destino (idempotente sobre repetidas
// llamadas).
//
// Ejemplo: asignaste Tirón A al jueves 28 may. Repetir 4 semanas → Tirón A
// aparece también en 4 jun, 11 jun, 18 jun, 25 jun.
export async function repeatWeekly(
  repo: ScheduledSessionRepo,
  source: ScheduledSession,
  weeks: number,
  idGenerator: () => string,
): Promise<Result<void, Error>> {
  if (weeks <= 0) return ok(undefined);
  for (let w = 1; w <= weeks; w++) {
    const targetDate = addDays(source.date, 7 * w);
    const result = await repo.upsertOnDate({
      id: idGenerator(),
      date: targetDate,
      routineId: source.routineId,
      createdAt: new Date(),
    });
    if (!result.ok) return result;
  }
  return ok(undefined);
}

