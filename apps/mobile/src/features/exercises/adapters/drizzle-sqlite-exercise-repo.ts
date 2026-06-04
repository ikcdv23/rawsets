import type { Db } from '@/db/connection';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Equipment } from '../domain/equipment';
import type { Exercise } from '../domain/exercise';
import type { MuscleGroup } from '../domain/muscle-groups';
import type { ExerciseRepo } from '../ports/exercise-repo';

// Adapter de ExerciseRepo basado en SQL crudo. Misma razón que en RoutineRepo:
// Drizzle usa la API sync de expo-sqlite que en web trunca buffers. Bajamos
// a `getAllAsync` / `runAsync` para que funcione en ambos targets sin parches.
export class DrizzleSqliteExerciseRepo implements ExerciseRepo {
  constructor(
    private readonly _db: Db,
    private readonly sqlite: SQLiteDatabase,
  ) {}

  async list(): Promise<Exercise[]> {
    const rows = await this.sqlite.getAllAsync<ExerciseRow>(
      `SELECT id, name, equipment,
              is_bodyweight AS isBodyweight,
              is_custom AS isCustom,
              created_at AS createdAt
         FROM exercises`,
    );
    const allMg = await this.sqlite.getAllAsync<MuscleGroupRow>(
      `SELECT exercise_id AS exerciseId, muscle_group AS muscleGroup, weight
         FROM exercise_muscle_groups`,
    );
    return rows.map((row) => toDomain(row, allMg));
  }

  async findById(id: string): Promise<Exercise | null> {
    const rows = await this.sqlite.getAllAsync<ExerciseRow>(
      `SELECT id, name, equipment,
              is_bodyweight AS isBodyweight,
              is_custom AS isCustom,
              created_at AS createdAt
         FROM exercises WHERE id = ?`,
      [id],
    );
    const row = rows[0];
    if (!row) return null;
    const mg = await this.sqlite.getAllAsync<MuscleGroupRow>(
      `SELECT exercise_id AS exerciseId, muscle_group AS muscleGroup, weight
         FROM exercise_muscle_groups WHERE exercise_id = ?`,
      [id],
    );
    return toDomain(row, mg);
  }

  async create(exercise: Omit<Exercise, 'createdAt'>): Promise<void> {
    const now = Date.now();
    await this.sqlite.runAsync(
      'INSERT INTO exercises (id, name, equipment, is_bodyweight, is_custom, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        exercise.id,
        exercise.name,
        exercise.equipment,
        exercise.isBodyweight ? 1 : 0,
        exercise.isCustom ? 1 : 0,
        now,
      ],
    );
    for (const mg of exercise.muscleGroups) {
      await this.sqlite.runAsync(
        'INSERT INTO exercise_muscle_groups (exercise_id, muscle_group, weight) VALUES (?, ?, ?)',
        [exercise.id, mg.group, mg.weight],
      );
    }
  }
}

// SQLite devuelve booleans como 0/1 enteros. Tipamos así y convertimos en toDomain.
type ExerciseRow = {
  id: string;
  name: string;
  equipment: Equipment;
  isBodyweight: number;
  isCustom: number;
  createdAt: number;
};

type MuscleGroupRow = {
  exerciseId: string;
  muscleGroup: MuscleGroup;
  weight: number;
};

function toDomain(row: ExerciseRow, allMuscleGroups: MuscleGroupRow[]): Exercise {
  return {
    id: row.id,
    name: row.name,
    equipment: row.equipment,
    isBodyweight: row.isBodyweight === 1,
    isCustom: row.isCustom === 1,
    createdAt: new Date(row.createdAt),
    muscleGroups: allMuscleGroups
      .filter((mg) => mg.exerciseId === row.id)
      .map((mg) => ({ group: mg.muscleGroup, weight: mg.weight })),
  };
}
