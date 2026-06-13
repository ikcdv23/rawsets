import { Result, ok, err } from '@/shared/result';
import type { Routine, RoutineExercise } from '../domain/routine';
import type { RoutineRepo } from '../ports/routine-repo';

export type CreateRoutineInput = {
  name: string;
  exercises?: RoutineExercise[];
};

// Crea una rutina. Validaciones de invariantes del dominio:
//  - nombre no vacío
//  - posiciones únicas y consecutivas (si hay ejercicios)
//
// El `idGenerator` se pasa por parámetro para mantener el use case PURO —
// testeable sin mockear `crypto`. La UI le pasa `() => crypto.randomUUID()`.
export async function createRoutine(
  repo: RoutineRepo,
  input: CreateRoutineInput,
  idGenerator: () => string,
): Promise<Result<string, Error>> {
  const name = input.name.trim();
  if (name.length === 0) {
    return err(new Error('El nombre de la rutina no puede estar vacío.'));
  }

  const exercises = input.exercises ?? [];
  const positions = exercises.map((e) => e.position).sort((a, b) => a - b);
  for (let i = 0; i < positions.length; i++) {
    if (positions[i] !== i + 1) {
      return err(new Error('Las posiciones de los ejercicios deben ser 1..N sin huecos.'));
    }
  }

  const id = idGenerator();
  const routine: Omit<Routine, 'createdAt'> = { id, name, exercises };
  const result = await repo.create(routine);
  if (!result.ok) return result;

  return ok(id);
}

