import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

/**
 * WorkoutSession — estado del entreno activo del usuario.
 *
 * Vive en UI, no en dominio: este context coordina lo que la app DEBE MOSTRAR
 * (tab bar morphada, sheet abierto/cerrado, timer corriendo, lista de
 * ejercicios). El dominio real de Workout/Set (ADR-0003) se enchufa después
 * cuando lleguemos a persistencia.
 *
 * En Fase 1 el estado es mock — vive en useState del provider. La UI cree que
 * tiene un workout real; cuando lleguemos a Drizzle, reemplazaremos
 * `startWorkout` / `finishWorkout` para crear/cerrar la fila en DB en vez de
 * solo `setState`.
 */

export type WorkoutExerciseStatus = 'pending' | 'current' | 'done';

export type WorkoutExercise = {
  id: string;
  name: string;
  /** Etiqueta del chip (ej. "Espalda", "Bíceps"). */
  muscleGroup: string;
  targetSets: number;
  /** Ya formateado para mostrar — "6", "8-12", etc. */
  targetReps: string;
  status: WorkoutExerciseStatus;
  /** Para ejercicio en curso: cuántas series llevas. null para pending/done. */
  currentSet: number | null;
};

export type ActiveWorkout = {
  id: string;
  startedAt: number;
  routineName: string | null;
  /** Subtítulo del header, e.g. "Día 2 / 5". null = entreno libre. */
  routineSubtitle: string | null;
  exercises: WorkoutExercise[];
};

type WorkoutSessionContextValue = {
  activeWorkout: ActiveWorkout | null;
  /** Ejercicio con status='current', derivado de la lista. null si no hay entreno. */
  currentExercise: WorkoutExercise | null;
  /** "3 / 6" — derivado: done + (hasCurrent ? 1 : 0) sobre total. */
  progressLabel: string | null;
  /** Tiempo transcurrido en segundos. 0 cuando no hay entreno. */
  elapsedSeconds: number;
  isSheetOpen: boolean;
  startWorkout: (params?: {
    routineName?: string | null;
    routineSubtitle?: string | null;
    exercises?: WorkoutExercise[];
  }) => void;
  finishWorkout: () => void;
  openSheet: () => void;
  closeSheet: () => void;
};

const WorkoutSessionContext = createContext<WorkoutSessionContextValue | null>(null);

export function WorkoutSessionProvider({ children }: { children: ReactNode }) {
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer.
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

  const startWorkout = useCallback<WorkoutSessionContextValue['startWorkout']>((params) => {
    setActiveWorkout({
      id: `local-${Date.now()}`,
      startedAt: Date.now(),
      routineName: params?.routineName ?? null,
      routineSubtitle: params?.routineSubtitle ?? null,
      exercises: params?.exercises ?? [],
    });
    setIsSheetOpen(false);
  }, []);

  const finishWorkout = useCallback(() => {
    setActiveWorkout(null);
    setIsSheetOpen(false);
  }, []);

  const openSheet = useCallback(() => setIsSheetOpen(true), []);
  const closeSheet = useCallback(() => setIsSheetOpen(false), []);

  // Derivados de la lista de ejercicios.
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

  const value = useMemo<WorkoutSessionContextValue>(
    () => ({
      activeWorkout,
      currentExercise,
      progressLabel,
      elapsedSeconds,
      isSheetOpen,
      startWorkout,
      finishWorkout,
      openSheet,
      closeSheet,
    }),
    [
      activeWorkout,
      currentExercise,
      progressLabel,
      elapsedSeconds,
      isSheetOpen,
      startWorkout,
      finishWorkout,
      openSheet,
      closeSheet,
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
