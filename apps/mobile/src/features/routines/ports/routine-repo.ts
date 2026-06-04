import type { Routine, RoutineExercise } from '../domain/routine';

// Port del repositorio de rutinas. Mismo patrón Hexagonal que ExerciseRepo:
// los casos de uso dependen de esta interface, no de Drizzle. Permite
// testear con fakes in-memory y cambiar de motor sin tocar dominio.
export type RoutineRepo = {
  list(): Promise<Routine[]>;
  findById(id: string): Promise<Routine | null>;
  create(routine: Omit<Routine, 'createdAt'>): Promise<void>;
  rename(id: string, name: string): Promise<void>;
  delete(id: string): Promise<void>;
  // Sustituye TODA la lista de ejercicios de la rutina por la nueva. Más simple
  // que add/remove individuales (no hace falta saber el estado previo) y se
  // mapea limpio a "DELETE FROM routine_exercises WHERE routine_id=X; INSERT ...".
  setExercises(routineId: string, exercises: RoutineExercise[]): Promise<void>;
};
