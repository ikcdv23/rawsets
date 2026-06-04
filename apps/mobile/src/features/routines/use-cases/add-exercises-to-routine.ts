import type { RoutineExercise } from '../domain/routine';
import type { RoutineRepo } from '../ports/routine-repo';

// Versión BATCH de add-exercise-to-routine. Existe por una razón sutil de
// race condition:
//
// Si llamáramos a `addExerciseToRoutine` N veces en paralelo (Promise.all),
// todas leerían la rutina con N=0 al mismo tiempo y calcularían `position = 1`
// para todas. Bug: posiciones duplicadas.
//
// Si las llamáramos secuencialmente con await dentro de un for, sería correcto
// pero costaría N round-trips DB. Para 5 ejercicios = 5 SELECT + 5 setExercises.
//
// Esta versión hace UN solo read + UN solo write. Calcula todas las posiciones
// nuevas en memoria. Atómico desde el punto de vista del estado consistente.
export type AddExerciseInput = {
  exerciseId: string;
  targetSets?: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  targetWeight?: number | null;
};

export async function addExercisesToRoutine(
  repo: RoutineRepo,
  routineId: string,
  inputs: AddExerciseInput[],
): Promise<{ added: number; skipped: number }> {
  if (inputs.length === 0) return { added: 0, skipped: 0 };

  const routine = await repo.findById(routineId);
  if (!routine) throw new Error(`Rutina ${routineId} no encontrada.`);

  // Skip los que ya están — la PK (routineId, exerciseId) no permite duplicados.
  const existing = new Set(routine.exercises.map((e) => e.exerciseId));
  const fresh = inputs.filter((i) => !existing.has(i.exerciseId));

  // Posición arranca tras la última existente. Cada nuevo ejercicio se asigna
  // posición incremental, manteniendo la invariante "1..N sin huecos".
  let nextPosition = routine.exercises.length;
  const additions: RoutineExercise[] = fresh.map((input) => {
    nextPosition += 1;
    return {
      exerciseId: input.exerciseId,
      position: nextPosition,
      targetSets: input.targetSets ?? 3,
      targetRepsMin: input.targetRepsMin ?? 8,
      targetRepsMax: input.targetRepsMax ?? 12,
      targetWeight: input.targetWeight ?? null,
      notes: null,
    };
  });

  if (additions.length === 0) {
    return { added: 0, skipped: inputs.length };
  }

  await repo.setExercises(routineId, [...routine.exercises, ...additions]);
  return { added: additions.length, skipped: inputs.length - additions.length };
}
