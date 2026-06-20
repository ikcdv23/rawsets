import type { Equipment } from './equipment';
import type { MuscleGroup } from './muscle-groups';

// Contribución de un ejercicio a un grupo muscular. `weight` 0..1+ — suma libre,
// no se normaliza (un compuesto puede pasar de 1 en total). Ver ADR-0002 §3.
export type MuscleGroupContribution = {
  group: MuscleGroup;
  weight: number;
};

// Agregado del dominio. Lo que la app y los casos de uso manejan.
// El schema Drizzle (adapters/schema.ts) es DETALLE de persistencia: divide
// esto en dos tablas (exercises + exercise_muscle_groups). El dominio no lo
// sabe ni le importa — habla siempre de Exercise como entidad completa.
export type Exercise = {
  id: string;
  name: string;
  equipment: Equipment;
  isBodyweight: boolean;
  isCustom: boolean;
  muscleGroups: MuscleGroupContribution[];
  imagePath?: string | null;
  createdAt: Date;
};
