import type { Db } from '@/db/connection';
import { type Result, toResult } from '@/shared/result';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Routine, RoutineExercise } from '../domain/routine';
import type { RoutineRepo } from '../ports/routine-repo';

// Adapter de RoutineRepo basado en SQL crudo (`runAsync` / `getAllAsync`).
//
// Por qué NO usa Drizzle (a pesar del nombre): en web, expo-sqlite envuelve
// wa-sqlite con un wrapper SÍNCRONO (busy-loop sobre SharedArrayBuffer) y
// trunca buffers de respuesta con relativa facilidad. Drizzle usa esa API
// sync para sus queries → cualquier read o write peta con "Unexpected end of
// JSON input". Las APIs `runAsync` / `getAllAsync` usan otro canal (postMessage
// + promesas) y van fino en ambos targets (móvil y web).
//
// El `db` (Drizzle) se mantiene en el constructor para que el día que
// expo-sqlite arregle el sync wrapper podamos volver a la ORM sin reescribir
// consumers. De momento no se usa.
//
// SELECT con alias `AS xxxYyy` para que las filas vengan en camelCase y
// coincidan con el contrato JS sin un map intermedio. SQLite es case-insensitive
// para identificadores así que da igual mayúsculas/minúsculas.
export class DrizzleSqliteRoutineRepo implements RoutineRepo {
  constructor(
    private readonly _db: Db,
    private readonly sqlite: SQLiteDatabase,
  ) {}

  async list(): Promise<Result<Routine[]>> {
    return toResult(
      (async () => {
        const rows = await this.sqlite.getAllAsync<RoutineRow>(
          'SELECT id, name, created_at AS createdAt FROM routines',
        );
        const allEx = await this.sqlite.getAllAsync<RoutineExerciseRow>(
          `SELECT routine_id AS routineId, exercise_id AS exerciseId, position,
              target_sets AS targetSets, target_reps_min AS targetRepsMin,
              target_reps_max AS targetRepsMax, target_weight AS targetWeight, notes
         FROM routine_exercises`,
        );
        return rows.map((row) => toDomain(row, allEx));
      })(),
    );
  }

  async findById(id: string): Promise<Result<Routine | null>> {
    return toResult(
      (async () => {
        const rows = await this.sqlite.getAllAsync<RoutineRow>(
          'SELECT id, name, created_at AS createdAt FROM routines WHERE id = ?',
          [id],
        );
        const row = rows[0];
        if (!row) return null;
        const ex = await this.sqlite.getAllAsync<RoutineExerciseRow>(
          `SELECT routine_id AS routineId, exercise_id AS exerciseId, position,
              target_sets AS targetSets, target_reps_min AS targetRepsMin,
              target_reps_max AS targetRepsMax, target_weight AS targetWeight, notes
         FROM routine_exercises WHERE routine_id = ?`,
          [id],
        );
        return toDomain(row, ex);
      })(),
    );
  }

  async create(routine: Omit<Routine, 'createdAt'>): Promise<Result<void>> {
    return toResult(
      (async () => {
        const now = Date.now();
        await this.sqlite.runAsync('INSERT INTO routines (id, name, created_at) VALUES (?, ?, ?)', [
          routine.id,
          routine.name,
          now,
        ]);
        for (const ex of routine.exercises) {
          await this.sqlite.runAsync(
            'INSERT INTO routine_exercises (routine_id, exercise_id, position, target_sets, target_reps_min, target_reps_max, target_weight, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              routine.id,
              ex.exerciseId,
              ex.position,
              ex.targetSets,
              ex.targetRepsMin,
              ex.targetRepsMax,
              ex.targetWeight,
              ex.notes,
            ],
          );
        }
      })(),
    );
  }

  async rename(id: string, name: string): Promise<Result<void>> {
    return toResult(
      this.sqlite.runAsync('UPDATE routines SET name = ? WHERE id = ?', [name, id]).then(() => {}),
    );
  }

  async delete(id: string): Promise<Result<void>> {
    return toResult(this.sqlite.runAsync('DELETE FROM routines WHERE id = ?', [id]).then(() => {}));
  }

  async setExercises(routineId: string, exercises: RoutineExercise[]): Promise<Result<void>> {
    return toResult(
      (async () => {
        await this.sqlite.runAsync('DELETE FROM routine_exercises WHERE routine_id = ?', [
          routineId,
        ]);
        for (const ex of exercises) {
          await this.sqlite.runAsync(
            'INSERT INTO routine_exercises (routine_id, exercise_id, position, target_sets, target_reps_min, target_reps_max, target_weight, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              routineId,
              ex.exerciseId,
              ex.position,
              ex.targetSets,
              ex.targetRepsMin,
              ex.targetRepsMax,
              ex.targetWeight,
              ex.notes,
            ],
          );
        }
      })(),
    );
  }
}

type RoutineRow = {
  id: string;
  name: string;
  createdAt: number;
};

type RoutineExerciseRow = {
  routineId: string;
  exerciseId: string;
  position: number;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetWeight: number | null;
  notes: string | null;
};

function toDomain(row: RoutineRow, allExercises: RoutineExerciseRow[]): Routine {
  return {
    id: row.id,
    name: row.name,
    createdAt: new Date(row.createdAt),
    exercises: allExercises
      .filter((re) => re.routineId === row.id)
      .sort((a, b) => a.position - b.position)
      .map(
        (re): RoutineExercise => ({
          exerciseId: re.exerciseId,
          position: re.position,
          targetSets: re.targetSets,
          targetRepsMin: re.targetRepsMin,
          targetRepsMax: re.targetRepsMax,
          targetWeight: re.targetWeight,
          notes: re.notes,
        }),
      ),
  };
}
