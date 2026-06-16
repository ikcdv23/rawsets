import { type Result, ok } from '@/shared/result';
import type { StartWorkoutInput, WorkoutRepo } from '../ports/workout-repo';

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
