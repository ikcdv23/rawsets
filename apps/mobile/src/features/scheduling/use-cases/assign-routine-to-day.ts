import type { Result } from '@/shared/result';
import type { ScheduledSessionRepo } from '../ports/scheduled-session-repo';

// Asigna una rutina a un día. Si el día ya tenía algo (otra rutina o descanso),
// lo reemplaza. `idGenerator` por parámetro para mantener el use case puro.
export async function assignRoutineToDay(
  repo: ScheduledSessionRepo,
  date: Date,
  routineId: string,
  idGenerator: () => string,
): Promise<Result<void, Error>> {
  return repo.upsertOnDate({
    id: idGenerator(),
    date,
    routineId,
    createdAt: new Date(),
  });
}
