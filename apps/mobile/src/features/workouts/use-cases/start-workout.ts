import { type Result, ok } from '@/shared/result';
import type { StartWorkoutInput, WorkoutRepo } from '../ports/workout-repo';

/**
 * Inicia un workout. Genera el id, sella el startedAt y delega al repo el
 * INSERT del header + sets placeholder.
 *
 * Caller (UI / context provider) recibe el id sintetizado para conservarlo
 * en memoria mientras dura la sesión — es la clave de todos los updateSet
 * posteriores.
 */
export type StartWorkoutCommand = {
  routineId: string | null;
  exercises: StartWorkoutInput['exercises'];
};

export async function startWorkout(
  repo: WorkoutRepo,
  command: StartWorkoutCommand,
  generateId: () => string = () => crypto.randomUUID(),
): Promise<Result<{ id: string; startedAt: Date }>> {
  const id = generateId();
  const startedAt = new Date();
  const result = await repo.startWorkout({
    id,
    routineId: command.routineId,
    startedAt,
    exercises: command.exercises,
  });

  if (!result.ok) return result;

  return ok({ id, startedAt });
}
