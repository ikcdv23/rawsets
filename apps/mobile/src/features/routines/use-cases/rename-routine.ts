import { Result, err } from '@/shared/result';
import type { RoutineRepo } from '../ports/routine-repo';

// Renombra una rutina. Validación de invariante: nombre no vacío tras trim.
export async function renameRoutine(
  repo: RoutineRepo,
  id: string,
  newName: string,
): Promise<Result<void, Error>> {
  const name = newName.trim();
  if (name.length === 0) {
    return err(new Error('El nombre de la rutina no puede estar vacío.'));
  }
  return repo.rename(id, name);
}

