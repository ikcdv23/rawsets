import { useRepos } from '@/db/repo-provider';
import { listExercises } from '@/features/exercises/use-cases/list-exercises';
import { finishWorkout as finishWorkoutUseCase } from '@/features/workouts/use-cases/finish-workout';
import { logSet } from '@/features/workouts/use-cases/log-set';
import { startWorkout as startWorkoutUseCase } from '@/features/workouts/use-cases/start-workout';
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/**
 * WorkoutSession — estado del entreno activo del usuario.
 *
 * Coordina lo que la UI muestra (tab bar morphada, sheet abierto/cerrado,
 * timer, lista de ejercicios) Y persiste cada cambio a SQLite de forma
 * incremental — un toggle de check o un cambio de peso escribe a DB en
 * background. Esto sobrevive a refresh / crash / cerrar pestaña.
 *
 * Estrategia de escritura: optimistic UI. Actualizo state local primero,
 * disparo la persistencia en paralelo. Si la DB falla, log y sigo — la
 * sesión en memoria sigue válida.
 *
 * Estrategia de lectura (rehidratado): al montar el provider, busco un
 * workout con finished_at IS NULL. Si lo hay, lo reconstruyo enriqueciendo
 * con datos del catálogo (nombres, grupos, targetReps de la rutina).
 */

// Un set logueado del usuario. reps/weight pueden ser 0 (bodyweight, calentamiento).
export type SetLog = {
  reps: number;
  weight: number;
  done: boolean;
};

export type WorkoutExerciseStatus = 'pending' | 'current' | 'done';

export type WorkoutExercise = {
  id: string;
  name: string;
  /** Etiqueta del chip (ej. "Espalda", "Bíceps"). */
  muscleGroup: string;
  targetSets: number;
  /** Ya formateado para mostrar — "6", "8-12", etc. */
  targetReps: string;
  /**
   * Status DERIVADO de sets — recomputado en cada acción.
   *   - all sets done    → 'done'
   *   - some sets done   → 'current' (el primero así)
   *   - no sets done     → 'pending'
   * Sólo UN ejercicio puede ser 'current' a la vez (el primero no-done).
   */
  status: WorkoutExerciseStatus;
  /** Para ejercicio en curso: número de la próxima serie a hacer (1-indexed). null = done o pending. */
  currentSet: number | null;
  /** Array de longitud === targetSets. Index 0 = serie 1. */
  sets: SetLog[];
};

export type ActiveWorkout = {
  id: string;
  startedAt: number;
  routineId: string | null;
  routineName: string | null;
  /** Subtítulo del header, e.g. "Día 2 / 5". null = entreno libre. */
  routineSubtitle: string | null;
  exercises: WorkoutExercise[];
};

// Shape de los exercises que recibe startWorkout. Sin status/currentSet/sets
// — los inicializa/recomputa el contexto.
export type StartWorkoutExercise = Omit<WorkoutExercise, 'status' | 'currentSet' | 'sets'> & {
  /** Opcional: si llegan sets pre-cargados (e.g. retomar entreno). */
  sets?: SetLog[];
};

type WorkoutSessionContextValue = {
  activeWorkout: ActiveWorkout | null;
  currentExercise: WorkoutExercise | null;
  /** "3 / 6" — derivado: done + (hasCurrent ? 1 : 0) sobre total. */
  progressLabel: string | null;
  /** Tiempo transcurrido en segundos. 0 cuando no hay entreno. */
  elapsedSeconds: number;
  /** Volumen acumulado total (sum reps × weight de los sets done). */
  totalVolumeKg: number;
  /** Series done a nivel workout — para el footer. */
  doneSetsCount: number;
  isSheetOpen: boolean;
  startWorkout: (params?: {
    routineId?: string | null;
    routineName?: string | null;
    routineSubtitle?: string | null;
    exercises?: StartWorkoutExercise[];
  }) => Promise<void>;
  finishWorkout: () => Promise<void>;
  openSheet: () => void;
  closeSheet: () => void;
  /** Actualiza valores de una serie (reps/weight). NO toca el done flag. */
  updateSet: (exerciseId: string, setIndex: number, patch: Partial<Omit<SetLog, 'done'>>) => void;
  /** Toggle done de una serie. Recomputa status del ejercicio + del workout. */
  toggleSetDone: (exerciseId: string, setIndex: number) => void;
};

const WorkoutSessionContext = createContext<WorkoutSessionContextValue | null>(null);

/**
 * Recompute `status` y `currentSet` de cada ejercicio basado en sus sets.
 * Sólo un ejercicio puede ser 'current' — el PRIMERO no completado.
 */
function recomputeStatuses(exercises: WorkoutExercise[]): WorkoutExercise[] {
  let foundCurrent = false;
  return exercises.map((ex): WorkoutExercise => {
    if (ex.sets.length === 0) {
      return { ...ex, status: 'pending', currentSet: null };
    }
    const allDone = ex.sets.every((s) => s.done);
    if (allDone) {
      return { ...ex, status: 'done', currentSet: null };
    }
    if (!foundCurrent) {
      foundCurrent = true;
      const nextIdx = ex.sets.findIndex((s) => !s.done);
      return { ...ex, status: 'current', currentSet: nextIdx + 1 };
    }
    return { ...ex, status: 'pending', currentSet: null };
  });
}

/** Inicializa un array de sets vacíos para un nuevo ejercicio. */
function emptySets(count: number): SetLog[] {
  return Array.from({ length: count }, () => ({ reps: 0, weight: 0, done: false }));
}

export function WorkoutSessionProvider({ children }: { children: ReactNode }) {
  const {
    workout: workoutRepo,
    exercise: exerciseRepo,
    routine: routineRepo,
  } = useRepos();

  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Ref espejo del state — leemos de aquí para calcular `next` sincrónicamente
  // y disparar la persistencia FUERA del updater de setState. Esto evita que
  // strict-mode duplique writes a DB (el updater se llama dos veces, el código
  // post-setState no).
  const activeWorkoutRef = useRef<ActiveWorkout | null>(null);
  activeWorkoutRef.current = activeWorkout;

  // Rehidratado al montar. Si hay workout con finished_at IS NULL, lo
  // reconstruimos enriqueciendo con datos del catálogo (nombres) y de la
  // rutina origen (targetReps). Si no hay, no pasa nada.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const persistedRes = await workoutRepo.findActiveOrNull();
      if (cancelled || !persistedRes.ok || !persistedRes.value) return;

      const persisted = persistedRes.value;

      const [catalogRes, routineRes] = await Promise.all([
        listExercises(exerciseRepo),
        persisted.routineId ? routineRepo.findById(persisted.routineId) : Promise.resolve(null),
      ]);
      if (cancelled) return;

      const catalog = catalogRes.ok ? catalogRes.value : [];
      const routine = routineRes && routineRes.ok ? routineRes.value : null;

      const exerciseById = new Map(catalog.map((e) => [e.id, e]));
      const routineExById = new Map(routine?.exercises.map((re) => [re.exerciseId, re]) ?? []);

      const hydratedExercises: WorkoutExercise[] = persisted.exercises
        .map((pe): WorkoutExercise | null => {
          const ex = exerciseById.get(pe.exerciseId);
          if (!ex) return null;
          const re = routineExById.get(pe.exerciseId);
          const targetReps =
            re?.targetRepsMin === re?.targetRepsMax
              ? `${re?.targetRepsMin ?? ''}`
              : `${re?.targetRepsMin ?? ''}-${re?.targetRepsMax ?? ''}`;
          return {
            id: pe.exerciseId,
            name: ex.name,
            muscleGroup: ex.muscleGroups[0]?.group ?? '',
            targetSets: pe.sets.length,
            targetReps: re ? targetReps : '—',
            status: 'pending',
            currentSet: null,
            sets: pe.sets,
          };
        })
        .filter((e): e is WorkoutExercise => e !== null);

      setActiveWorkout({
        id: persisted.id,
        startedAt: persisted.startedAt.getTime(),
        routineId: persisted.routineId,
        routineName: routine?.name ?? null,
        routineSubtitle: null,
        exercises: recomputeStatuses(hydratedExercises),
      });
    })().catch((err) => console.error('[workout] rehydrate error:', err));
    return () => {
      cancelled = true;
    };
  }, [workoutRepo, exerciseRepo, routineRepo]);

  // Timer del workout activo.
  useEffect(() => {
    if (!activeWorkout) {
      setElapsedSeconds(0);
      return;
    }
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - activeWorkout.startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeWorkout]);

  const startWorkout = useCallback<WorkoutSessionContextValue['startWorkout']>(
    async (params) => {
      const exercisesIn = params?.exercises ?? [];
      const rawExercises: WorkoutExercise[] = exercisesIn.map((ex) => ({
        ...ex,
        sets: ex.sets ?? emptySets(ex.targetSets),
        status: 'pending',
        currentSet: null,
      }));

      // Persistir primero — necesitamos el id real antes de setear state, para
      // que cualquier write subsiguiente apunte al workout correcto.
      const result = await startWorkoutUseCase(workoutRepo, {
        routineId: params?.routineId ?? null,
        exercises: rawExercises.map((ex, i) => ({
          exerciseId: ex.id,
          position: i + 1,
          targetSets: ex.targetSets,
        })),
      });

      if (!result.ok) {
        console.error('[workout] start error:', result.error);
        return;
      }

      const { id, startedAt } = result.value;

      setActiveWorkout({
        id,
        startedAt: startedAt.getTime(),
        routineId: params?.routineId ?? null,
        routineName: params?.routineName ?? null,
        routineSubtitle: params?.routineSubtitle ?? null,
        exercises: recomputeStatuses(rawExercises),
      });
      setIsSheetOpen(false);
    },
    [workoutRepo],
  );

  const finishWorkout = useCallback(async () => {
    const current = activeWorkoutRef.current;
    if (!current) return;
    const result = await finishWorkoutUseCase(workoutRepo, current.id);
    if (!result.ok) {
      console.error('[workout] finish error:', result.error);
    }
    setActiveWorkout(null);
    setIsSheetOpen(false);
  }, [workoutRepo]);

  const openSheet = useCallback(() => setIsSheetOpen(true), []);
  const closeSheet = useCallback(() => setIsSheetOpen(false), []);

  const updateSet = useCallback<WorkoutSessionContextValue['updateSet']>(
    (exerciseId, setIndex, patch) => {
      const prev = activeWorkoutRef.current;
      if (!prev) return;
      const nextExercises = prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const newSets = ex.sets.map((s, i) => (i === setIndex ? { ...s, ...patch } : s));
        return { ...ex, sets: newSets };
      });
      const next = { ...prev, exercises: recomputeStatuses(nextExercises) };
      setActiveWorkout(next);

      // Persistir el set actualizado. Background, no await.
      const ex = next.exercises.find((e) => e.id === exerciseId);
      const s = ex?.sets[setIndex];
      if (s) {
        logSet(workoutRepo, {
          workoutId: next.id,
          exerciseId,
          setNumber: setIndex + 1,
          weight: s.weight,
          reps: s.reps,
          done: s.done,
        }).then((res) => {
          if (!res.ok) console.error('[workout] persist updateSet error:', res.error);
        });
      }
    },
    [workoutRepo],
  );

  const toggleSetDone = useCallback<WorkoutSessionContextValue['toggleSetDone']>(
    (exerciseId, setIndex) => {
      const prev = activeWorkoutRef.current;
      if (!prev) return;
      const nextExercises = prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const newSets = ex.sets.map((s, i) => (i === setIndex ? { ...s, done: !s.done } : s));
        return { ...ex, sets: newSets };
      });
      const next = { ...prev, exercises: recomputeStatuses(nextExercises) };
      setActiveWorkout(next);

      const ex = next.exercises.find((e) => e.id === exerciseId);
      const s = ex?.sets[setIndex];
      if (s) {
        logSet(workoutRepo, {
          workoutId: next.id,
          exerciseId,
          setNumber: setIndex + 1,
          weight: s.weight,
          reps: s.reps,
          done: s.done,
        }).then((res) => {
          if (!res.ok) console.error('[workout] persist toggleSetDone error:', res.error);
        });
      }
    },
    [workoutRepo],
  );

  // Derivados.
  const currentExercise = useMemo(
    () => activeWorkout?.exercises.find((e) => e.status === 'current') ?? null,
    [activeWorkout],
  );

  const progressLabel = useMemo(() => {
    if (!activeWorkout || activeWorkout.exercises.length === 0) return null;
    const doneCount = activeWorkout.exercises.filter((e) => e.status === 'done').length;
    const hasCurrent = activeWorkout.exercises.some((e) => e.status === 'current');
    const numerator = doneCount + (hasCurrent ? 1 : 0);
    return `${numerator} / ${activeWorkout.exercises.length}`;
  }, [activeWorkout]);

  const totalVolumeKg = useMemo(() => {
    if (!activeWorkout) return 0;
    let v = 0;
    for (const ex of activeWorkout.exercises) {
      for (const s of ex.sets) {
        if (s.done) v += s.reps * s.weight;
      }
    }
    return v;
  }, [activeWorkout]);

  const doneSetsCount = useMemo(() => {
    if (!activeWorkout) return 0;
    return activeWorkout.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => s.done).length,
      0,
    );
  }, [activeWorkout]);

  const value = useMemo<WorkoutSessionContextValue>(
    () => ({
      activeWorkout,
      currentExercise,
      progressLabel,
      elapsedSeconds,
      totalVolumeKg,
      doneSetsCount,
      isSheetOpen,
      startWorkout,
      finishWorkout,
      openSheet,
      closeSheet,
      updateSet,
      toggleSetDone,
    }),
    [
      activeWorkout,
      currentExercise,
      progressLabel,
      elapsedSeconds,
      totalVolumeKg,
      doneSetsCount,
      isSheetOpen,
      startWorkout,
      finishWorkout,
      openSheet,
      closeSheet,
      updateSet,
      toggleSetDone,
    ],
  );

  return <WorkoutSessionContext.Provider value={value}>{children}</WorkoutSessionContext.Provider>;
}

export function useWorkoutSession(): WorkoutSessionContextValue {
  const ctx = useContext(WorkoutSessionContext);
  if (!ctx) {
    throw new Error(
      'useWorkoutSession debe usarse dentro de <WorkoutSessionProvider>. ' +
        'Asegúrate de envolver tu árbol con el Provider (típicamente en _layout.tsx raíz).',
    );
  }
  return ctx;
}

/**
 * Formatea segundos como MM:SS o HH:MM:SS si >1h.
 */
export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
