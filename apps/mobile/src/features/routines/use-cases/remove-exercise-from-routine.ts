import type { RoutineRepo } from '../ports/routine-repo';

// Elimina un ejercicio de una rutina y reorganiza las posiciones restantes
// para que sigan siendo 1..N sin huecos. La invariante "positions densas"
// es importante para la UI (orden visual) y para futuras analíticas.
export async function removeExerciseFromRoutine(
  repo: RoutineRepo,
  routineId: string,
  exerciseId: string,
): Promise<void> {
  const routine = await repo.findById(routineId);
  if (!routine) throw new Error(`Rutina ${routineId} no encontrada.`);

  const remaining = routine.exercises
    .filter((e) => e.exerciseId !== exerciseId)
    .sort((a, b) => a.position - b.position)
    .map((e, idx) => ({ ...e, position: idx + 1 }));

  await repo.setExercises(routineId, remaining);
}
