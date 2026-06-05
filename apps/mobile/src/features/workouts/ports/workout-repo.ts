import type { MuscleGroup } from '@/features/exercises/domain/muscle-groups';
import type { Workout } from '../domain/workout';

// Port del repositorio de workouts. Mismo patrón Hexagonal que RoutineRepo:
// los casos de uso dependen de esta interface, no de Drizzle. Permite testear
// con fakes in-memory y cambiar de motor (e.g., Supabase en Fase 2) sin tocar
// dominio ni UI.
//
// Granularidad de escritura: NO existe un `save(workout)` agregado. La sesión
// vive en SQLite *durante* el entreno — escribimos a medida que el usuario
// avanza, no al final. Razón: si la app se refresca/cierra a mitad, los sets
// ya marcados deben sobrevivir. Esto habilita la feature "retomar entreno".
//
// El identificador estable de un set es la tupla (workoutId, exerciseId,
// setNumber). La PK `sets.id` es sintética y opaca al dominio.

export type WorkoutRepo = {
  /**
   * Crea el workout + inserta TODOS los sets placeholder (done=false,
   * weight=0, reps=0) en una sola transacción. Tras esto, cada interacción
   * del usuario es un UPDATE puntual vía updateSet().
   */
  startWorkout(input: StartWorkoutInput): Promise<void>;

  /**
   * Actualiza UN set ya existente (creado por startWorkout). Se identifica
   * por la tupla (workoutId, exerciseId, setNumber). Si done pasa de
   * false→true, el adapter también escribe completed_at.
   */
  updateSet(input: UpdateSetInput): Promise<void>;

  /** Cierra el workout (workouts.finished_at = finishedAt). */
  finishWorkout(workoutId: string, finishedAt: Date): Promise<void>;

  /**
   * Devuelve el workout en curso (finished_at IS NULL) o null. Para
   * rehidratar el context al montar el provider tras refresh / reapertura.
   * Si hubiera varios (no debería), devuelve el más reciente.
   */
  findActiveOrNull(): Promise<Workout | null>;

  /**
   * Devuelve los sets done del último workout FINALIZADO que tenga registros
   * de este ejercicio. Ordenados por setNumber asc — index 0 = serie 1.
   * Para la columna "Previa". Array vacío si no hay histórico.
   */
  getPreviousSetValues(exerciseId: string): Promise<PreviousSetValue[]>;

  /**
   * Volumen acumulado por grupo muscular para sets done en [from, to). El
   * JOIN con exercise_muscle_groups + agregación SUM(reps*weight*contribution)
   * lo hace SQL — más rápido que traer 500 sets crudos a JS y sumar.
   * Decisión consciente: el repo conoce el catálogo de mapping ejercicio→grupo.
   * Pureza < eficiencia para esta query.
   * El use case se encarga de normalizar a porcentaje 0-100.
   */
  aggregateMuscleVolumeInRange(
    from: Date,
    to: Date,
  ): Promise<Array<{ muscleGroup: MuscleGroup; volumeKg: number }>>;
};

export type StartWorkoutInput = {
  id: string;
  routineId: string | null;
  startedAt: Date;
  exercises: Array<{
    exerciseId: string;
    /** Orden del ejercicio dentro del workout (1, 2, 3…). */
    position: number;
    /** Cuántos sets placeholder generar para este ejercicio. */
    targetSets: number;
  }>;
};

export type UpdateSetInput = {
  workoutId: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  done: boolean;
};

export type PreviousSetValue = {
  setNumber: number;
  weight: number;
  reps: number;
};
