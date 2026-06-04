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
): Promise<void> {
  const routine = await repo.findById(routineId);
  if (!routine) throw new Error(`Rutina ${routineId} no encontrada.`);

  // Aplica el patch sobre el ejercicio target manteniendo el resto intactos.
  let touched = false;
  const next: RoutineExercise[] = routine.exercises.map((re) => {
    if (re.exerciseId !== exerciseId) return re;
    touched = true;
    const merged: RoutineExercise = { ...re, ...patch };

    // Invariantes de dominio.
    if (merged.targetSets < 1) {
      throw new Error('targetSets debe ser >= 1.');
    }
    if (merged.targetRepsMin < 1 || merged.targetRepsMax < 1) {
      throw new Error('targetReps debe ser >= 1.');
    }
    if (merged.targetRepsMin > merged.targetRepsMax) {
      throw new Error('targetRepsMin no puede ser mayor que targetRepsMax.');
    }
    if (merged.targetWeight !== null && merged.targetWeight < 0) {
      throw new Error('targetWeight debe ser >= 0.');
    }

    return merged;
  });

  if (!touched) {
    throw new Error(`Ejercicio ${exerciseId} no está en la rutina ${routineId}.`);
  }

  await repo.setExercises(routineId, next);
}
