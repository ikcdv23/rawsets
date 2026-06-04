import type { Equipment } from './equipment';
import type { Exercise } from './exercise';
import type { MuscleGroup } from './muscle-groups';

import curatedJson from '../seed/curated.json';
import userJson from '../seed/user.json';

// Catálogo que se siembra en cada arranque (idempotente — skip por id).
//
// Dos fuentes:
//  - `seed/curated.json` — los ejercicios que vienen con la app. Edítalo si
//    quieres añadir/corregir entradas del catálogo "oficial".
//  - `seed/user.json` — empieza vacío `[]`. Aquí puedes meter A MANO los
//    ejercicios que tú haces y no están en curated (sin pasar por la UI).
//    Útil mientras la UI de "+ Crear ejercicio" no exista todavía.
//
// Convenciones:
//  - `id` = slug kebab-case del nombre. Determinista — la seed es idempotente
//    (si ya existe ese id en DB, no se reinserta).
//  - `weight` por grupo muscular: contribución relativa al esfuerzo del músculo
//    en el ejercicio. 1.0 = grupo primario; 0.3 sinérgico; 0.2 estabilizador.
//    Suma libre (ADR-0002 §3) — un compuesto puede sumar >1.
//
// Para añadir uno nuevo: copia una entrada del JSON, edita el id/name/grupos.
// La validación de tipos sucede en este archivo al hacer `as CuratedExercise[]`:
// si el JSON tiene un grupo inválido, TS lo pillará al compilar.
//
// `Omit<..., 'isCustom' | 'createdAt'>` porque ambos los pone el seed
// automáticamente (isCustom=false, createdAt=now).
export type CuratedExercise = Omit<Exercise, 'isCustom' | 'createdAt'>;

// Forma esperada del JSON (más permisiva: equipment y muscleGroup vienen como
// string, los validamos al hacer cast). Si quieres validar en runtime con Zod
// o similar, este es el punto.
type CuratedJsonEntry = {
  id: string;
  name: string;
  equipment: Equipment;
  isBodyweight: boolean;
  muscleGroups: Array<{ group: MuscleGroup; weight: number }>;
};

const curated = curatedJson as CuratedJsonEntry[];
const userExtras = userJson as CuratedJsonEntry[];

// Combinamos curated + user en una sola lista. Si el usuario añade un id que
// ya existe en curated, el de user prevalece (gana el último — útil si quieres
// "override" un curated sin tocar el JSON oficial).
const byId = new Map<string, CuratedExercise>();
for (const e of [...curated, ...userExtras]) {
  byId.set(e.id, e);
}

export const CURATED_EXERCISES: CuratedExercise[] = Array.from(byId.values());
