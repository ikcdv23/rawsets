// Mapeo de los ~80 IDs anatómicos detallados de `body-muscles` a nuestros
// **11 grupos planos de Fase 1** (ver ADR-0001 / ficha técnica §6).
//
// Por qué este mapping:
//   `body-muscles` está hecho con granularidad anatómica fina (cabezas
//   tricipitales, secciones de lats, partes del trapecio…). RAWSETS Fase 1
//   trabaja con grupos planos ("pecho", no "pectoral mayor + menor + serrato").
//   La granularidad fina llega en Fase 2 cuando exista demanda real.
//
// Mantenibilidad:
//   Si añades un grupo plano nuevo en Fase 2, lo metes aquí. Si quieres
//   subdividir un grupo (split pecho en upper/lower), creas un nuevo
//   PrimaryGroup y reasignas las IDs.
//
// IDs NO clasificados (cabeza, manos, pies, codos, rodillas, espina):
//   Se quedan fuera del mapping → se pintan en neutro (no son músculos
//   entrenables de forma aislada en el sentido de RAWSETS).

// Estos son los 11 grupos de Fase 1 — fuente de verdad de la app.
export type PrimaryMuscleGroup =
  | 'pecho'
  | 'espalda'
  | 'hombro'
  | 'biceps'
  | 'triceps'
  | 'antebrazo'
  | 'cuadriceps'
  | 'isquios'
  | 'gluteo'
  | 'pantorrilla'
  | 'core';

// Forma del mapping: por grupo plano → array de IDs detallados.
// Esta dirección es la natural para preguntar "¿qué pinto si me dicen
// pecho?". La dirección inversa (id → group) se calcula con el index.
const GROUP_TO_DETAIL_IDS: Record<PrimaryMuscleGroup, string[]> = {
  pecho: ['chest-upper-left', 'chest-upper-right', 'chest-lower-left', 'chest-lower-right'],
  espalda: [
    // Lats (todas las secciones)
    'lats-upper-left',
    'lats-upper-right',
    'lats-mid-left',
    'lats-mid-right',
    'lats-lower-left',
    'lats-lower-right',
    // Trapecio medio/inferior — el superior va en hombro (más relevante a deltoide)
    'traps-mid-left',
    'traps-mid-right',
    'traps-lower-left',
    'traps-lower-right',
    // Zona lumbar (parte de espalda funcional/musculatura)
    'lower-back-erectors-left',
    'lower-back-erectors-right',
    'lower-back-ql-left',
    'lower-back-ql-right',
  ],
  hombro: [
    'shoulder-front-left',
    'shoulder-front-right',
    'shoulder-side-left',
    'shoulder-side-right',
    'deltoid-rear-left',
    'deltoid-rear-right',
    // Traps upper se siente como hombro (shrugs), va aquí
    'traps-upper-left',
    'traps-upper-right',
  ],
  biceps: ['biceps-left', 'biceps-right'],
  triceps: [
    'triceps-long-left',
    'triceps-long-right',
    'triceps-lateral-left',
    'triceps-lateral-right',
  ],
  antebrazo: [
    'forearm-left',
    'forearm-right',
    'forearm-flexors-left',
    'forearm-flexors-right',
    'forearm-extensors-left',
    'forearm-extensors-right',
  ],
  cuadriceps: [
    'quads-left',
    'quads-right',
    // Aductores (parte interior del muslo) — clínicamente discutible, en
    // entrenamiento "pierna" general suelen entrar con cuádriceps.
    'adductors-left',
    'adductors-right',
  ],
  isquios: [
    'hamstrings-medial-left',
    'hamstrings-medial-right',
    'hamstrings-lateral-left',
    'hamstrings-lateral-right',
  ],
  gluteo: [
    'gluteus-maximus-left',
    'gluteus-maximus-right',
    'gluteus-medius-left',
    'gluteus-medius-right',
  ],
  pantorrilla: [
    'calves-gastroc-medial-left',
    'calves-gastroc-medial-right',
    'calves-gastroc-lateral-left',
    'calves-gastroc-lateral-right',
    'calves-soleus-left',
    'calves-soleus-right',
    // Tibial anterior — músculo de la espinilla, complemento de pantorrilla
    'tibialis-anterior-left',
    'tibialis-anterior-right',
  ],
  core: [
    'abs-upper-left',
    'abs-upper-right',
    'abs-lower-left',
    'abs-lower-right',
    'obliques-left',
    'obliques-right',
    'serratus-anterior-left',
    'serratus-anterior-right',
    'hip-flexor-left',
    'hip-flexor-right',
  ],
};

// Index inverso construido una vez al cargar el módulo — O(1) lookup
// muscleId → grupo. Construirlo dinámicamente evita errores de mantener
// dos estructuras en sync.
const DETAIL_TO_GROUP: Record<string, PrimaryMuscleGroup> = (() => {
  const out: Record<string, PrimaryMuscleGroup> = {};
  for (const [group, ids] of Object.entries(GROUP_TO_DETAIL_IDS)) {
    for (const id of ids) {
      out[id] = group as PrimaryMuscleGroup;
    }
  }
  return out;
})();

// API pública.

export function groupForMuscleId(id: string): PrimaryMuscleGroup | null {
  return DETAIL_TO_GROUP[id] ?? null;
}

export function muscleIdsForGroup(group: PrimaryMuscleGroup): string[] {
  return GROUP_TO_DETAIL_IDS[group];
}

export function allMuscleGroups(): PrimaryMuscleGroup[] {
  return Object.keys(GROUP_TO_DETAIL_IDS) as PrimaryMuscleGroup[];
}

// Etiquetas legibles para UI. Acentos y mayúsculas correctas.
export const GROUP_LABELS: Record<PrimaryMuscleGroup, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombro: 'Hombro',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  antebrazo: 'Antebrazo',
  cuadriceps: 'Cuádriceps',
  isquios: 'Isquios',
  gluteo: 'Glúteo',
  pantorrilla: 'Pantorrilla',
  core: 'Core',
};
