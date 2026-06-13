import { Result, err } from '@/shared/result';
import type { RoutineRepo } from '../ports/routine-repo';

// Elimina un ejercicio de una rutina y reorganiza las posiciones restantes
// para que sigan siendo 1..N sin huecos. La invariante "positions densas"
// es importante para la UI (orden visual) y para futuras analíticas.
export async function removeExerciseFromRoutine(
  repo: RoutineRepo,
  routineId: string,
  exerciseId: string,
): Promise<Result<void, Error>> {
  const result = await repo.findById(routineId);
  if (!result.ok) return result;
  const routine = result.value;

  if (!routine) return err(new Error(`Rutina ${routineId} no encontrada.`));

  const remaining = routine.exercises
    .filter((e) => e.exerciseId !== exerciseId)
    .sort((a, b) => a.position - b.position)
    .map((e, idx) => ({ ...e, position: idx + 1 }));

  return repo.setExercises(routineId, remaining);
}

