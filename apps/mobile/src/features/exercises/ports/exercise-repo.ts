import type { Exercise } from '../domain/exercise';

// Port (interface) del repositorio de ejercicios.
//
// Hexagonal: los casos de uso dependen de ESTA interface, no de la
// implementación Drizzle. Eso permite:
//  - testear use-cases con un fake in-memory sin tocar SQLite.
//  - cambiar de motor (Drizzle → otra cosa) sin tocar el dominio.
//
// `createdAt` lo estampa el adapter, no el caller — por eso `Omit` en `create`.
export type ExerciseRepo = {
  list(): Promise<Exercise[]>;
  findById(id: string): Promise<Exercise | null>;
  create(exercise: Omit<Exercise, 'createdAt'>): Promise<void>;
};
