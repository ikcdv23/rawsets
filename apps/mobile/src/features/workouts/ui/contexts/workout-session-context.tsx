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
 * (tab bar morphada, sheet abierto/cerrado, timer corriendo). El dominio real
 * de Workout/Set (ADR-0003) se enchufa después aquí dentro cuando lleguemos a
 * persistencia.
 *
 * En Fase 1 el estado es mock — vive en useState del provider. La UI cree que
 * tiene un workout real; cuando lleguemos a Drizzle, reemplazaremos
 * `startWorkout` / `finishWorkout` para crear/cerrar la fila en DB en vez de
 * solo `setState`.
 */

export type ActiveWorkoutExercise = {
  name: string;
  setNumber: number;
  totalSets: number;
};

export type ActiveWorkout = {
  id: string;
  startedAt: number; // ms desde epoch
  routineName: string | null; // null = entreno libre
  currentExercise: ActiveWorkoutExercise | null;
};

type WorkoutSessionContextValue = {
  activeWorkout: ActiveWorkout | null;
  /** Tiempo transcurrido en segundos. 0 cuando no hay entreno. */
  elapsedSeconds: number;
  /** ¿Está el sheet (panel desplegable) abierto? */
  isSheetOpen: boolean;
  startWorkout: (params?: {
    routineName?: string | null;
    currentExercise?: ActiveWorkoutExercise | null;
  }) => void;
  finishWorkout: () => void;
  openSheet: () => void;
  closeSheet: () => void;
  /** Cambia el ejercicio actual (se usará desde la UI del entreno). */
  setCurrentExercise: (exercise: ActiveWorkoutExercise | null) => void;
};

const WorkoutSessionContext = createContext<WorkoutSessionContextValue | null>(null);

export function WorkoutSessionProvider({ children }: { children: ReactNode }) {
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer: si hay entreno, recalcula segundos transcurridos cada segundo.
  // Cuando no hay entreno, no monta el interval (zero work).
  useEffect(() => {
    if (!activeWorkout) {
      setElapsedSeconds(0);
      return;
    }
    // Tick inmediato para evitar el "0" inicial entre que arranca y el primer interval.
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - activeWorkout.startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeWorkout]);

  const startWorkout = useCallback<WorkoutSessionContextValue['startWorkout']>((params) => {
    setActiveWorkout({
      // En Fase 1 el id es temporal — cuando lleguemos a DB, será uuid persistido.
      id: `local-${Date.now()}`,
      startedAt: Date.now(),
      routineName: params?.routineName ?? null,
      currentExercise: params?.currentExercise ?? null,
    });
    // Por defecto, al arrancar entreno NO abrimos el sheet — el user se queda
    // en home y ve la barra morphada. Toca el strip y lo abre cuando quiere.
    setIsSheetOpen(false);
  }, []);

  const finishWorkout = useCallback(() => {
    setActiveWorkout(null);
    setIsSheetOpen(false);
  }, []);

  const openSheet = useCallback(() => setIsSheetOpen(true), []);
  const closeSheet = useCallback(() => setIsSheetOpen(false), []);

  const setCurrentExercise = useCallback<WorkoutSessionContextValue['setCurrentExercise']>(
    (exercise) => {
      setActiveWorkout((prev) => (prev ? { ...prev, currentExercise: exercise } : prev));
    },
    [],
  );

  // useMemo evita que cada render cree un objeto value nuevo (que romperia
  // memoización de cualquier consumidor que use React.memo).
  const value = useMemo<WorkoutSessionContextValue>(
    () => ({
      activeWorkout,
      elapsedSeconds,
      isSheetOpen,
      startWorkout,
      finishWorkout,
      openSheet,
      closeSheet,
      setCurrentExercise,
    }),
    [
      activeWorkout,
      elapsedSeconds,
      isSheetOpen,
      startWorkout,
      finishWorkout,
      openSheet,
      closeSheet,
      setCurrentExercise,
    ],
  );

  return <WorkoutSessionContext.Provider value={value}>{children}</WorkoutSessionContext.Provider>;
}

/**
 * Hook para consumir el context. Lanza si se llama fuera del Provider —
 * pista clara cuando alguien usa el hook sin haber montado el Provider arriba
 * en el árbol.
 */
export function useWorkoutSession(): WorkoutSessionContextValue {
  const ctx = useContext(WorkoutSessionContext);
  if (!ctx) {
    throw new Error(
      'useWorkoutSession debe usarse dentro de <WorkoutSessionProvider>. ' +
        'Asegúrate de envolver tu árbol con el Provider (típicamente en (workspace)/_layout.tsx).',
    );
  }
  return ctx;
}

/**
 * Formatea segundos como MM:SS (o HH:MM:SS si >1h).
 * Útil para mostrar el tiempo transcurrido en la tab bar y el sheet.
 */
export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
