export const MUSCLE_GROUPS = [
  'pecho',
  'espalda',
  'hombro',
  'biceps',
  'triceps',
  'antebrazo',
  'cuadriceps',
  'isquios',
  'gluteo',
  'pantorrilla',
  'core',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
