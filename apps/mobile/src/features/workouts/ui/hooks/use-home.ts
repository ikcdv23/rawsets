import { useRepos } from "@/db/repo-provider";
import type { Exercise } from "@/features/exercises/domain/exercise";
import type { MuscleGroup } from "@/features/exercises/domain/muscle-groups";
import { MUSCLE_TARGETS } from "@/features/exercises/domain/muscle-targets";
import type { Routine } from "@/features/routines/domain/routine";
import { addDays, startOfDay } from "@/features/scheduling/domain/dates";
import type { ScheduledSession } from "@/features/scheduling/domain/scheduled-session";
import { listScheduledInRange } from "@/features/scheduling/use-cases/list-scheduled-in-range";
import { listExercises } from "@/features/exercises/use-cases/list-exercises";
import { computeMuscleVolumeByRange, type MuscleBalanceItem } from "@/features/workouts/use-cases/compute-muscle-volume-by-range";
import { useWorkoutSession, type StartWorkoutExercise } from "@/features/workouts/ui/contexts/workout-session-context";
import type { RadarAxis } from "@/components/ui/radar-chart";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";

// --- TIPOS ---

export type TodayState = 
  | { kind: 'workout'; routine: Routine } 
  | { kind: 'rest' } 
  | { kind: 'free' };

// --- CONSTANTES ---

const RADAR_AXES_CONFIG: Array<{ label: string; groups: MuscleGroup[] }> = [
  { label: 'Pecho', groups: ['pecho'] },
  { label: 'Brazos', groups: ['biceps', 'triceps', 'antebrazo'] },
  { label: 'Piernas', groups: ['cuadriceps', 'isquios', 'gluteo', 'pantorrilla'] },
  { label: 'Core', groups: ['core'] },
  { label: 'Espalda', groups: ['espalda'] },
  { label: 'Hombros', groups: ['hombro'] },
];

const RADAR_EMPTY: RadarAxis[] = RADAR_AXES_CONFIG.map((a) => ({ label: a.label, value: 0 }));

// --- HOOK ORQUESTADOR ---

export function useHome() {
  const router = useRouter();
  const {
    routine: routineRepo,
    exercise: exerciseRepo,
    schedule: scheduleRepo,
    workout: workoutRepo,
  } = useRepos();

  const { activeWorkout, startWorkout, finishWorkout } = useWorkoutSession();

  // Estados
  const [radarInfoOpen, setRadarInfoOpen] = useState(false);
  const [todaySession, setTodaySession] = useState<ScheduledSession | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [muscleBalance, setMuscleBalance] = useState<MuscleBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Carga de datos
  const reload = useCallback(async () => {
    try {
      const now = new Date();
      const today = startOfDay(now);
      const tomorrow = addDays(today, 1);
      const radarFrom = addDays(today, -13);
      const radarTo = new Date(now.getTime() + 1);

      const [schRes, rsRes, catRes, balanceRes] = await Promise.all([
        listScheduledInRange(scheduleRepo, today, tomorrow),
        routineRepo.list(),
        listExercises(exerciseRepo),
        computeMuscleVolumeByRange(workoutRepo, radarFrom, radarTo),
      ]);

      if (schRes.ok) setTodaySession(schRes.value[0] ?? null);
      if (rsRes.ok) setRoutines(rsRes.value);
      if (catRes.ok) setCatalog(catRes.value);
      if (balanceRes.ok) setMuscleBalance(balanceRes.value);

      [schRes, rsRes, catRes, balanceRes].forEach((r) => {
        if (!r.ok) console.error('[useHome] load error:', r.error);
      });
    } catch (err) {
      console.error('[useHome] unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, [scheduleRepo, routineRepo, exerciseRepo, workoutRepo]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  // Memos y transformaciones
  const catalogById = useMemo(() => new Map(catalog.map((e) => [e.id, e])), [catalog]);
  const routinesById = useMemo(() => new Map(routines.map((r) => [r.id, r])), [routines]);

  const { axes: radarAxes, flaggedLabel } = useMemo(
    () => buildRadarAxes(muscleBalance),
    [muscleBalance],
  );
  
  const hasHistory = useMemo(
    () => muscleBalance.some((b) => b.volumeKg > 0),
    [muscleBalance]
  );

  const todayState: TodayState = useMemo(() => {
    if (!todaySession) return { kind: 'free' };
    if (todaySession.routineId === null) return { kind: 'rest' };
    const r = routinesById.get(todaySession.routineId);
    if (!r) return { kind: 'free' };
    return { kind: 'workout', routine: r };
  }, [todaySession, routinesById]);

  // Acciones
  const handleStartWorkout = useCallback(async (routine: Routine) => {
    const exercises = buildWorkoutExercises(routine, catalogById);
    try {
      await startWorkout({
        routineId: routine.id,
        routineName: routine.name,
        routineSubtitle: null,
        exercises,
      });
    } catch (err) {
      console.error('[useHome] startWorkout error:', err);
    }
  }, [catalogById, startWorkout]);

  const handleFinishWorkoutDev = useCallback(async () => {
    try {
      await finishWorkout();
    } catch (err) {
      console.error('[useHome] finishWorkout error:', err);
    }
  }, [finishWorkout]);

  return {
    state: {
      loading,
      radarInfoOpen,
      activeWorkout: activeWorkout !== null,
      today: todayState,
      catalogById,
      radarAxes: hasHistory ? radarAxes : RADAR_EMPTY,
      hasHistory,
      flaggedLabel,
    },
    ui: {
      openRadarInfo: () => setRadarInfoOpen(true),
      closeRadarInfo: () => setRadarInfoOpen(false),
      navigateToRoutines: () => router.push('/routines'),
    },
    actions: {
      startWorkout: handleStartWorkout,
      finishWorkoutDev: handleFinishWorkoutDev,
    }
  };
}

// --- FUNCIONES DE APOYO (Próximamente Use Cases) ---

function buildRadarAxes(balance: MuscleBalanceItem[]): {
  axes: RadarAxis[];
  flaggedLabel: string | null;
} {
  const byGroup = new Map(balance.map((b) => [b.muscleGroup, b]));

  const axes = RADAR_AXES_CONFIG.map(({ label, groups }) => {
    let currentVolume = 0;
    let targetVolume = 0;

    for (const g of groups) {
      currentVolume += byGroup.get(g)?.volumeKg ?? 0;
      targetVolume += MUSCLE_TARGETS[g] ?? 10000;
    }

    const value = targetVolume > 0 ? Math.round((currentVolume / targetVolume) * 100) : 0;

    return {
      label,
      value: Math.min(120, value),
    };
  });

  const hasActivity = axes.some((a) => a.value > 0);
  if (!hasActivity) {
    return { axes: RADAR_EMPTY, flaggedLabel: null };
  }

  const lowestValue = Math.min(...axes.map((a) => a.value));
  const lowestAxis = axes.find((a) => a.value === lowestValue);
  const flaggedLabel = lowestAxis && lowestAxis.value < 60 ? lowestAxis.label : null;

  const axesWithFlag = axes.map(
    (a): RadarAxis => (a.label === flaggedLabel ? { ...a, flagged: true } : a),
  );

  return { axes: axesWithFlag, flaggedLabel };
}

function buildWorkoutExercises(
  routine: Routine,
  catalogById: Map<string, Exercise>,
): StartWorkoutExercise[] {
  return routine.exercises
    .sort((a, b) => a.position - b.position)
    .map((re): StartWorkoutExercise => {
      const ex = catalogById.get(re.exerciseId);
      const repsLabel =
        re.targetRepsMin === re.targetRepsMax
          ? `${re.targetRepsMin}`
          : `${re.targetRepsMin}-${re.targetRepsMax}`;
      const primaryMuscle = ex?.muscleGroups[0]?.group ?? 'general';
      return {
        id: re.exerciseId,
        name: ex?.name ?? 'Ejercicio',
        muscleGroup: primaryMuscle.charAt(0).toUpperCase() + primaryMuscle.slice(1),
        targetSets: re.targetSets,
        targetReps: repsLabel,
      };
    });
}
