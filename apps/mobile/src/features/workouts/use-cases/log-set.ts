import type { Result } from '@/shared/result';
import type { UpdateSetInput, WorkoutRepo } from '../ports/workout-repo';

/**
 * Persiste el estado actual de UN set. Se llama:
 *
 *   - al cambiar weight/reps (done queda igual)
 *   - al hacer toggle del check (done cambia)
 *
 * El context UI llama a esto en cada acción del usuario para que la sesión
 * sobreviva a un refresh. Es passthrough hoy — mañana puede emitir un evento
 * para "PR detectado" o sembrar el timer de descanso.
 */
export function logSet(repo: WorkoutRepo, input: UpdateSetInput): Promise<Result<void>> {
  return repo.updateSet(input);
}
