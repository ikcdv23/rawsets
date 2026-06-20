import { type Result, err, ok } from '@/shared/result';
import type { RoutineExercise } from '../domain/routine';
import type { RoutineRepo } from '../ports/routine-repo';

export type UpdateRoutineExerciseInput = Partial<
  Pick<RoutineExercise, 'targetSets' | 'targetRepsMin' | 'targetRepsMax' | 'targetWeight' | 'notes'>
>;

// Actualiza los targets de UN ejercicio dentro de una rutina. Valida invariantes
// del dominio antes de tocar persistencia.
//
// Reutiliza `setExercises` del repo (delete-then-insert atómico para esa
// rutina) en vez de añadir un puerto `update` específico — menos superficie
// que mantener; el coste extra de re-insertar N filas es trivial para
// rutinas con <30 ejercicios.
export async function updateRoutineExercise(
  repo: RoutineRepo,
  routineId: string,
  exerciseId: string,
  patch: UpdateRoutineExerciseInput,
): Promise<Result<void, Error>> {
  const result = await repo.findById(routineId);
  if (!result.ok) return result;
  const routine = result.value;

  if (!routine) return err(new Error(`Rutina ${routineId} no encontrada.`));

  // Aplica el patch sobre el ejercicio target manteniendo el resto intactos.
  let touched = false;
  let validationError: Error | null = null;

  const next: RoutineExercise[] = routine.exercises.map((re) => {
    if (re.exerciseId !== exerciseId) return re;
    touched = true;
    const merged: RoutineExercise = { ...re, ...patch };

    // Invariantes de dominio.
    if (merged.targetSets < 1) {
      validationError = new Error('targetSets debe ser >= 1.');
    } else if (merged.targetRepsMin < 1 || merged.targetRepsMax < 1) {
      validationError = new Error('targetReps debe ser >= 1.');
    } else if (merged.targetRepsMin > merged.targetRepsMax) {
      validationError = new Error('targetRepsMin no puede ser mayor que targetRepsMax.');
    } else if (merged.targetWeight !== null && merged.targetWeight < 0) {
      validationError = new Error('targetWeight debe ser >= 0.');
    }

    return merged;
  });

  if (validationError) return err(validationError);

  if (!touched) {
    return err(new Error(`Ejercicio ${exerciseId} no está en la rutina ${routineId}.`));
  }

  return repo.setExercises(routineId, next);
}
