import type { Routine } from '../domain/routine';
import type { RoutineRepo } from '../ports/routine-repo';

// Wrapper trivial sobre repo.list(). Existe como caso de uso explícito por
// dos razones: (1) la UI nunca importa el adapter, solo el use case;
// (2) si mañana hace falta ordenar / filtrar / cachear, ese lugar es aquí.
export async function listRoutines(repo: RoutineRepo): Promise<Routine[]> {
  const all = await repo.list();
  // Orden por defecto: las más recientes primero.
  return all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
