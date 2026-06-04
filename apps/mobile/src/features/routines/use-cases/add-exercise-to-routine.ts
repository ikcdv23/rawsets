import type { RoutineExercise } from '../domain/routine';
import type { RoutineRepo } from '../ports/routine-repo';

// Añade un ejercicio al final de la rutina. Idempotente: si ya existía,
// no duplica (un ejercicio solo puede estar una vez en la misma rutina,
// por la PK compuesta (routineId, exerciseId)).
//
// Defaults para los targets — el usuario los edita después si quiere.
export type AddExerciseToRoutineInput = {
  exerciseId: string;
  targetSets?: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  targetWeight?: number | null;
};

export async function addExerciseToRoutine(
  repo: RoutineRepo,
  routineId: string,
  input: AddExerciseToRoutineInput,
): Promise<void> {
  const routine = await repo.findById(routineId);
  if (!routine) throw new Error(`Rutina ${routineId} no encontrada.`);

  if (routine.exercises.some((e) => e.exerciseId === input.exerciseId)) {
    // Ya estaba — no-op idempotente. La UI puede mostrarlo con un toast tipo
    // "ya está en la rutina" si quiere.
    return;
  }

  const nextPosition = routine.exercises.length + 1;
  const newExercise: RoutineExercise = {
    exerciseId: input.exerciseId,
    position: nextPosition,
    targetSets: input.targetSets ?? 3,
    targetRepsMin: input.targetRepsMin ?? 8,
    targetRepsMax: input.targetRepsMax ?? 12,
    targetWeight: input.targetWeight ?? null,
    notes: null,
  };

  await repo.setExercises(routineId, [...routine.exercises, newExercise]);
}
