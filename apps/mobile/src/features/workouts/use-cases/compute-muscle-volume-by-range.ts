import { MUSCLE_GROUPS, type MuscleGroup } from '@/features/exercises/domain/muscle-groups';
import type { WorkoutRepo } from '../ports/workout-repo';

/**
 * Calcula el balance muscular para el radar en una ventana temporal.
 *
 * El repo devuelve el SUM(reps × weight × contribución) por grupo, ya
 * agregado en SQL. Aquí sólo:
 *   1. Rellenamos los grupos sin actividad con 0 (el radar pinta 11 ejes
 *      siempre — un grupo ausente NO es un eje colapsado).
 *   2. Normalizamos a porcentaje 0-100 dividiendo por el máximo.
 *
 * Normalizar al MÁXIMO (no a la suma):
 *   - "Balance" significa "qué tan equilibrados están entre sí los grupos".
 *   - El más trabajado marca el techo = 100.
 *   - Los demás muestran qué tan lejos están de él. Si todos a 100 = perfecto.
 *   - Normalizar a suma sería % del esfuerzo total — interesante pero
 *     otro insight (lo añadimos cuando haya pantalla stats dedicada).
 */
export type MuscleBalanceItem = {
  muscleGroup: MuscleGroup;
  volumeKg: number;
  /** 0-100, redondeado a entero. */
  percent: number;
};

export async function computeMuscleVolumeByRange(
  repo: WorkoutRepo,
  from: Date,
  to: Date,
): Promise<MuscleBalanceItem[]> {
  const rows = await repo.aggregateMuscleVolumeInRange(from, to);
  const volumesByGroup = new Map<MuscleGroup, number>(rows.map((r) => [r.muscleGroup, r.volumeKg]));

  const maxVolume = Math.max(0, ...rows.map((r) => r.volumeKg));

  return MUSCLE_GROUPS.map((mg): MuscleBalanceItem => {
    const volume = volumesByGroup.get(mg) ?? 0;
    const percent = maxVolume > 0 ? Math.round((volume / maxVolume) * 100) : 0;
    return { muscleGroup: mg, volumeKg: volume, percent };
  });
}
