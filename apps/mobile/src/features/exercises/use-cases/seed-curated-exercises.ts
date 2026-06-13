import { type Result, ok } from '@/shared/result';
import { CURATED_EXERCISES } from '../domain/curated-exercises';
import type { ExerciseRepo } from '../ports/exercise-repo';

// Inserta los ejercicios curados que aún no existen en la DB.
//
// Idempotente: lee el catálogo, calcula qué ids faltan, inserta solo esos.
// Llamable en cada arranque sin riesgo de duplicar.
//
// Diseño: no borra los que ya están. Si el usuario editó los `weight` de
// un curado, su versión gana (ADR-0002 §3: "no hay reset to default" en Fase 1).
// Si en una release futura cambias el seed (más ejercicios), los nuevos
// aparecen sin pisar el trabajo del usuario.
export async function seedCuratedExercises(repo: ExerciseRepo): Promise<
  Result<{
    inserted: number;
    skipped: number;
  }>
> {
  const existingResult = await repo.list();
  if (!existingResult.ok) return existingResult;

  const existing = existingResult.value;
  const existingIds = new Set(existing.map((e) => e.id));

  let inserted = 0;
  let skipped = 0;

  for (const curated of CURATED_EXERCISES) {
    if (existingIds.has(curated.id)) {
      skipped++;
      continue;
    }
    const createResult = await repo.create({ ...curated, isCustom: false });
    if (!createResult.ok) return createResult;
    inserted++;
  }

  return ok({ inserted, skipped });
}
