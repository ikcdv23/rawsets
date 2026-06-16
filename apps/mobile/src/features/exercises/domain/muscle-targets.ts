import type { MuscleGroup } from './muscle-groups';

/**
 * Objetivos de volumen por grupo muscular para un periodo de 14 días.
 *
 * Basado en heurísticas de volumen de entrenamiento para hipertrofia
 * (Schoenfeld, Mike Israetel/Renaissance Periodization).
 *
 * NOTA: Estos valores son estimaciones de "Tonelaje" (Kg x Reps x Contribución)
 * para un usuario intermedio. En Fase 2, estos valores serán personalizables
 * por el perfil del usuario (principiante, intermedio, avanzado).
 */
export const MUSCLE_TARGETS: Record<MuscleGroup, number> = {
  // Grupos Grandes (Más masa, más carga absoluta)
  pecho: 12000,
  espalda: 14000,
  cuadriceps: 15000,

  // Grupos Medios
  hombro: 8000,
  gluteo: 9000,
  isquios: 8000,

  // Grupos Pequeños (Menos masa, aislamiento común)
  biceps: 4000,
  triceps: 5000,
  antebrazo: 3000,
  pantorrilla: 4000,
  core: 5000,
};
