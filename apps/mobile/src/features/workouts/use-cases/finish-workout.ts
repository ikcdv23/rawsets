import type { Result } from '@/shared/result';
import type { WorkoutRepo } from '../ports/workout-repo';

/**
 * Cierra el workout sellando finished_at. Pasa a ser histórico — alimenta
 * radar, columna "Previa", stats. La sesión en memoria del context puede
 * limpiarse tras esto.
 */
export function finishWorkout(
  repo: WorkoutRepo,
  workoutId: string,
  finishedAt: Date = new Date(),
): Promise<Result<void>> {
  return repo.finishWorkout(workoutId, finishedAt);
}
