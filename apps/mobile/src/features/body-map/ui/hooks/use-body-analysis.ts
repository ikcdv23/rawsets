import { useRepos } from '@/db/repo-provider';
import { addDays, startOfDay } from '@/features/scheduling/domain/dates';
import {
  type MuscleBalanceItem,
  computeMuscleVolumeByRange,
} from '@/features/workouts/use-cases/compute-muscle-volume-by-range';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GROUP_LABELS,
  type PrimaryMuscleGroup,
} from '../../domain/muscle-group-map';
import type { GroupColors } from '../components/body-map';

// Configuración de la escala de calor (Heatmap)
// Usamos el token de acento (Lima #B8FA82) con diferentes opacidades.
const HEAT_COLORS = {
  NONE: undefined,
  LOW: '#B8FA8233', // 20%
  MEDIUM: '#B8FA8266', // 40%
  HIGH: '#B8FA82AA', // 66%
  MAX: '#B8FA82', // 100%
};

function getHeatColor(percent: number): string | undefined {
  if (percent <= 0) return HEAT_COLORS.NONE;
  if (percent < 25) return HEAT_COLORS.LOW;
  if (percent < 50) return HEAT_COLORS.MEDIUM;
  if (percent < 75) return HEAT_COLORS.HIGH;
  return HEAT_COLORS.MAX;
}

export function useBodyAnalysis() {
  const { workout: workoutRepo } = useRepos();
  const [balance, setBalance] = useState<MuscleBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const now = new Date();
      const today = startOfDay(now);
      // Ventana de 90 días para el "histórico" del cuerpo
      const from = addDays(today, -89);
      const to = new Date(now.getTime() + 1);

      const res = await computeMuscleVolumeByRange(workoutRepo, from, to);
      if (res.ok) {
        setBalance(res.value);
      }
    } catch (err) {
      console.error('[useBodyAnalysis] error:', err);
    } finally {
      setLoading(false);
    }
  }, [workoutRepo]);

  useEffect(() => {
    reload();
  }, [reload]);

  const colors = useMemo((): GroupColors => {
    const map: GroupColors = {};
    for (const item of balance) {
      const color = getHeatColor(item.percent);
      if (color) {
        map[item.muscleGroup as PrimaryMuscleGroup] = color;
      }
    }
    return map;
  }, [balance]);

  // Asegurar que tenemos los 11 grupos para la lista, ordenados por porcentaje
  const fullBalance = useMemo(() => {
    const map = new Map(balance.map((b) => [b.muscleGroup, b]));
    return (Object.keys(GROUP_LABELS) as PrimaryMuscleGroup[])
      .map((group) => {
        return map.get(group) || { muscleGroup: group, volumeKg: 0, percent: 0 };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [balance]);

  const balanceByGroup = useMemo(() => {
    return new Map(fullBalance.map((b) => [b.muscleGroup, b]));
  }, [fullBalance]);

  return {
    loading,
    colors,
    fullBalance,
    balanceByGroup,
    reload,
  };
}
