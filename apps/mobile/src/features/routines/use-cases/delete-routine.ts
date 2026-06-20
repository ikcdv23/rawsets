import type { Result } from '@/shared/result';
import type { RoutineRepo } from '../ports/routine-repo';

// Borra una rutina. Por el ON DELETE CASCADE de routine_exercises, los
// ejercicios asociados se limpian automáticamente desde el schema.
//
// Workouts existentes con routineId apuntando a esta rutina NO se borran
// (ON DELETE SET NULL): la sesión histórica sobrevive, simplemente queda
// como "entreno libre" en retroactiva. Ver ADR-0003 §1 y ADR-0004 §"Implementación".
export async function deleteRoutine(repo: RoutineRepo, id: string): Promise<Result<void, Error>> {
  return repo.delete(id);
}
