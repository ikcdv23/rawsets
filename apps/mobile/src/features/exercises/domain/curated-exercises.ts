import type { Exercise } from './exercise';

// Catálogo curado que se siembra en la primera ejecución de la app.
//
// Convenciones:
//  - `id` = slug kebab-case del nombre. Determinista — la seed es idempotente
//    (si ya existe ese id, no se reinserta).
//  - `weight` por grupo muscular: contribución relativa al esfuerzo del músculo
//    en el ejercicio. 1.0 = grupo primario; 0.3 sinérgico; 0.2 estabilizador.
//    Suma libre (ADR-0002 §3) — un compuesto puede sumar >1.
//  - Pesos heurísticos basados en literatura general; el usuario los puede
//    editar desde su instancia (ADR-0002 §3).
//
// Para añadir uno nuevo: copia una entrada, edita el id/name/equipment/grupos.
// El typing te valida los grupos contra el enum `MuscleGroup`.
//
// `Omit<..., 'isCustom' | 'createdAt'>` porque ambos los pone el seed
// automáticamente (isCustom=false, createdAt=now).
export type CuratedExercise = Omit<Exercise, 'isCustom' | 'createdAt'>;

export const CURATED_EXERCISES: CuratedExercise[] = [
  // Empuje horizontal
  {
    id: 'press-banca',
    name: 'Press banca',
    equipment: 'barra',
    isBodyweight: false,
    muscleGroups: [
      { group: 'pecho', weight: 1.0 },
      { group: 'hombro', weight: 0.3 },
      { group: 'triceps', weight: 0.4 },
    ],
  },
  {
    id: 'press-banca-mancuernas',
    name: 'Press banca con mancuernas',
    equipment: 'mancuerna',
    isBodyweight: false,
    muscleGroups: [
      { group: 'pecho', weight: 1.0 },
      { group: 'hombro', weight: 0.4 },
      { group: 'triceps', weight: 0.3 },
    ],
  },
  {
    id: 'press-inclinado',
    name: 'Press inclinado',
    equipment: 'barra',
    isBodyweight: false,
    muscleGroups: [
      { group: 'pecho', weight: 0.8 },
      { group: 'hombro', weight: 0.6 },
      { group: 'triceps', weight: 0.4 },
    ],
  },
  {
    id: 'fondos',
    name: 'Fondos en paralelas',
    equipment: 'peso-corporal',
    isBodyweight: true,
    muscleGroups: [
      { group: 'pecho', weight: 0.8 },
      { group: 'hombro', weight: 0.4 },
      { group: 'triceps', weight: 0.6 },
    ],
  },

  // Empuje vertical
  {
    id: 'press-militar',
    name: 'Press militar',
    equipment: 'barra',
    isBodyweight: false,
    muscleGroups: [
      { group: 'hombro', weight: 1.0 },
      { group: 'triceps', weight: 0.4 },
      { group: 'core', weight: 0.2 },
    ],
  },
  {
    id: 'elevaciones-laterales',
    name: 'Elevaciones laterales',
    equipment: 'mancuerna',
    isBodyweight: false,
    muscleGroups: [{ group: 'hombro', weight: 1.0 }],
  },

  // Tirón vertical
  {
    id: 'dominadas',
    name: 'Dominadas',
    equipment: 'peso-corporal',
    isBodyweight: true,
    muscleGroups: [
      { group: 'espalda', weight: 1.0 },
      { group: 'biceps', weight: 0.5 },
      { group: 'antebrazo', weight: 0.3 },
    ],
  },
  {
    id: 'jalon-pecho',
    name: 'Jalón al pecho',
    equipment: 'polea',
    isBodyweight: false,
    muscleGroups: [
      { group: 'espalda', weight: 1.0 },
      { group: 'biceps', weight: 0.4 },
    ],
  },

  // Tirón horizontal
  {
    id: 'remo-barra',
    name: 'Remo con barra',
    equipment: 'barra',
    isBodyweight: false,
    muscleGroups: [
      { group: 'espalda', weight: 1.0 },
      { group: 'biceps', weight: 0.4 },
      { group: 'antebrazo', weight: 0.2 },
    ],
  },
  {
    id: 'peso-muerto',
    name: 'Peso muerto',
    equipment: 'barra',
    isBodyweight: false,
    muscleGroups: [
      { group: 'espalda', weight: 0.8 },
      { group: 'gluteo', weight: 0.7 },
      { group: 'isquios', weight: 0.7 },
      { group: 'core', weight: 0.4 },
      { group: 'antebrazo', weight: 0.3 },
    ],
  },
  {
    id: 'peso-muerto-rumano',
    name: 'Peso muerto rumano',
    equipment: 'barra',
    isBodyweight: false,
    muscleGroups: [
      { group: 'isquios', weight: 1.0 },
      { group: 'gluteo', weight: 0.7 },
      { group: 'espalda', weight: 0.4 },
    ],
  },

  // Pierna
  {
    id: 'sentadilla',
    name: 'Sentadilla',
    equipment: 'barra',
    isBodyweight: false,
    muscleGroups: [
      { group: 'cuadriceps', weight: 1.0 },
      { group: 'gluteo', weight: 0.5 },
      { group: 'isquios', weight: 0.3 },
      { group: 'core', weight: 0.3 },
    ],
  },
  {
    id: 'prensa-45',
    name: 'Prensa 45°',
    equipment: 'maquina',
    isBodyweight: false,
    muscleGroups: [
      { group: 'cuadriceps', weight: 1.0 },
      { group: 'gluteo', weight: 0.4 },
    ],
  },
  {
    id: 'curl-femoral',
    name: 'Curl femoral',
    equipment: 'maquina',
    isBodyweight: false,
    muscleGroups: [{ group: 'isquios', weight: 1.0 }],
  },
  {
    id: 'extension-cuadriceps',
    name: 'Extensión de cuádriceps',
    equipment: 'maquina',
    isBodyweight: false,
    muscleGroups: [{ group: 'cuadriceps', weight: 1.0 }],
  },
  {
    id: 'gemelos-de-pie',
    name: 'Gemelos de pie',
    equipment: 'maquina',
    isBodyweight: false,
    muscleGroups: [{ group: 'pantorrilla', weight: 1.0 }],
  },

  // Brazo
  {
    id: 'curl-barra',
    name: 'Curl con barra',
    equipment: 'barra',
    isBodyweight: false,
    muscleGroups: [
      { group: 'biceps', weight: 1.0 },
      { group: 'antebrazo', weight: 0.3 },
    ],
  },
  {
    id: 'curl-martillo',
    name: 'Curl martillo',
    equipment: 'mancuerna',
    isBodyweight: false,
    muscleGroups: [
      { group: 'biceps', weight: 0.8 },
      { group: 'antebrazo', weight: 0.6 },
    ],
  },
  {
    id: 'extension-triceps-polea',
    name: 'Extensión de tríceps en polea',
    equipment: 'polea',
    isBodyweight: false,
    muscleGroups: [{ group: 'triceps', weight: 1.0 }],
  },

  // Core
  {
    id: 'plancha',
    name: 'Plancha',
    equipment: 'peso-corporal',
    isBodyweight: true,
    muscleGroups: [{ group: 'core', weight: 1.0 }],
  },
  {
    id: 'crunch',
    name: 'Crunch abdominal',
    equipment: 'peso-corporal',
    isBodyweight: true,
    muscleGroups: [{ group: 'core', weight: 1.0 }],
  },
];
