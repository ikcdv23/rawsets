import type { Result } from '@/shared/result';
import type { Exercise } from '../domain/exercise';
import type { ExerciseRepo } from '../ports/exercise-repo';

// Caso de uso trivial — listar todo el catálogo. La UI lo llama directo.
// Cuando aparezcan filtros (por equipment, por muscleGroup), se añaden
// como casos de uso separados: `list-exercises-by-equipment`, etc.
// No metemos parámetros opcionales aquí para no acabar con un Dios-method.
export async function listExercises(repo: ExerciseRepo): Promise<Result<Exercise[]>> {
  return repo.list();
}
