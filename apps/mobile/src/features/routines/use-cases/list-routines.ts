import { type Result, ok } from '@/shared/result';
import type { Routine } from '../domain/routine';
import type { RoutineRepo } from '../ports/routine-repo';

// Wrapper trivial sobre repo.list(). Existe como caso de uso explícito por
// dos razones: (1) la UI nunca importa el adapter, solo el use case;
// (2) si mañana hace falta ordenar / filtrar / cachear, ese lugar es aquí.
export async function listRoutines(repo: RoutineRepo): Promise<Result<Routine[], Error>> {
  const result = await repo.list();
  if (!result.ok) return result;
  const all = result.value;

  // Orden por defecto: las más recientes primero.
  const sorted = all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return ok(sorted);
}
