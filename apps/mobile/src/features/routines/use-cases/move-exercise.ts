import { type Result, err, ok } from '@/shared/result';
import type { RoutineExercise } from '../domain/routine';
import type { RoutineRepo } from '../ports/routine-repo';

// Mueve un ejercicio una posición arriba o abajo dentro de la rutina.
// Atómico: lee → swap con vecino → reescribe la lista entera vía setExercises.
//
// Por qué "una posición" en vez de "fromIndex → toIndex": para el patrón
// UX de botones up/down en cada row es lo más natural. Si más adelante
// metemos drag-and-drop, abrimos otra use case `reorderExercises(ids[])`.
export async function moveExerciseInRoutine(
  repo: RoutineRepo,
  routineId: string,
  exerciseId: string,
  direction: 'up' | 'down',
): Promise<Result<void, Error>> {
  const result = await repo.findById(routineId);
  if (!result.ok) return result;
  const routine = result.value;

  if (!routine) return err(new Error(`Rutina ${routineId} no encontrada.`));

  const ordered = [...routine.exercises].sort((a, b) => a.position - b.position);
  const idx = ordered.findIndex((e) => e.exerciseId === exerciseId);
  if (idx < 0) return err(new Error(`Ejercicio ${exerciseId} no está en la rutina ${routineId}.`));

  const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= ordered.length) {
    // Bordes: no hace nada, no es error (el botón debería estar disabled
    // en la UI, pero por si llega la llamada igual no rompemos).
    return ok(undefined);
  }

  // Swap en la lista. `idx` y `targetIdx` ya están validados a estar en rango
  // arriba (findIndex >= 0 + check de bordes), pero TS no lo deduce con
  // `noUncheckedIndexedAccess`. Spread inverso para evitar mutación + as.
  const a = ordered[idx];
  const b = ordered[targetIdx];
  if (!a || !b) return ok(undefined);
  ordered[idx] = b;
  ordered[targetIdx] = a;

  // Reasignar positions densamente 1..N para preservar la invariante.
  const next: RoutineExercise[] = ordered.map((e, i) => ({ ...e, position: i + 1 }));

  return repo.setExercises(routineId, next);
}
