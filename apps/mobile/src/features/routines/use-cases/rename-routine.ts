import type { RoutineRepo } from '../ports/routine-repo';

// Renombra una rutina. Validación de invariante: nombre no vacío tras trim.
export async function renameRoutine(repo: RoutineRepo, id: string, newName: string): Promise<void> {
  const name = newName.trim();
  if (name.length === 0) {
    throw new Error('El nombre de la rutina no puede estar vacío.');
  }
  await repo.rename(id, name);
}
