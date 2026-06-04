import type { SQLiteDatabase } from 'expo-sqlite';
import { CURATED_EXERCISES } from '../domain/curated-exercises';

// Versión "raw" del seed que NO pasa por Drizzle.
//
// Por qué existe: en web, expo-sqlite envuelve la API sync sobre el worker
// wa-sqlite, que tiene buffers fijos. Con muchas filas o transacciones
// complejas trunca respuestas → "Unterminated string in JSON". Drizzle usa
// la API sync por debajo.
//
// `runAsync` y `getAllAsync` van por un canal separado (no busy-loop, no
// buffer truncado). Aceptamos perder la abstracción del repo aquí porque:
//  - es código de bootstrap (infraestructura), no dominio.
//  - se ejecuta UNA vez al arrancar la app.
//  - el SQL es trivial (sin JOINs, sin agregaciones).
//
// Si en algún momento llega un problema parecido en otro flujo, la lección
// es la misma: para grandes lotes en web, baja a runAsync/getAllAsync.
export async function seedCuratedExercisesRaw(
  sqlite: SQLiteDatabase,
): Promise<{ inserted: number; skipped: number }> {
  // 1) Set de ids existentes — un único SELECT pequeño, sin riesgo.
  const existingRows = await sqlite.getAllAsync<{ id: string }>('SELECT id FROM exercises');
  const existing = new Set(existingRows.map((r) => r.id));

  const toInsert = CURATED_EXERCISES.filter((e) => !existing.has(e.id));
  const now = Date.now();

  for (const ex of toInsert) {
    await sqlite.runAsync(
      'INSERT INTO exercises (id, name, equipment, is_bodyweight, is_custom, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [ex.id, ex.name, ex.equipment, ex.isBodyweight ? 1 : 0, 0, now],
    );
    for (const mg of ex.muscleGroups) {
      await sqlite.runAsync(
        'INSERT INTO exercise_muscle_groups (exercise_id, muscle_group, weight) VALUES (?, ?, ?)',
        [ex.id, mg.group, mg.weight],
      );
    }
  }

  return { inserted: toInsert.length, skipped: existing.size };
}
