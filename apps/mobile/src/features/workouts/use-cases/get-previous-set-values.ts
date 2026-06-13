import { type Result, ok } from '@/shared/result';
import type { WorkoutRepo } from '../ports/workout-repo';

/**
 * Devuelve los valores de la columna "Previa" indexados por setNumber.
 *
 *   index 0 → previa de la serie 1
 *   index 1 → previa de la serie 2
 *   ...
 *
 * Si el último workout tuvo 3 sets done y el actual tiene 4, el index 3
 * devuelve null. La UI muestra em-dash en ese hueco.
 *
 * Devuelve null en cada posición (no array más corto) para que la UI pueda
 * indexar sin bounds-check — más simple para el caller.
 */
export type PreviousSetLabel = { weight: number; reps: number } | null;

export async function getPreviousSetValues(
  repo: WorkoutRepo,
  exerciseId: string,
  targetSets: number,
): Promise<Result<PreviousSetLabel[]>> {
  const result = await repo.getPreviousSetValues(exerciseId);
  if (!result.ok) return result;

  const rows = result.value;
  const byNumber = new Map(rows.map((r) => [r.setNumber, { weight: r.weight, reps: r.reps }]));
  const values = Array.from({ length: targetSets }, (_, i) => byNumber.get(i + 1) ?? null);

  return ok(values);
}
