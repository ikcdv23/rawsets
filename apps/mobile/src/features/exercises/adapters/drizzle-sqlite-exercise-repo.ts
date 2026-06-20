import type { Db } from '@/db/connection';
import { type Result, toResult } from '@/shared/result';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Equipment } from '../domain/equipment';
import type { Exercise } from '../domain/exercise';
import type { MuscleGroup } from '../domain/muscle-groups';
import type { ExerciseRepo } from '../ports/exercise-repo';

export class DrizzleSqliteExerciseRepo implements ExerciseRepo {
  constructor(
    private readonly _db: Db,
    private readonly sqlite: SQLiteDatabase,
  ) {}

  async list(): Promise<Result<Exercise[]>> {
    return toResult(
      (async () => {
        const rows = await this.sqlite.getAllAsync<any>(
          `SELECT id, name, equipment,
              is_bodyweight AS isBodyweight,
              is_custom AS isCustom,
              image_path AS imagePath,
              created_at AS createdAt
         FROM exercises`,
        );
        const allMg = await this.sqlite.getAllAsync<any>(
          `SELECT exercise_id AS exerciseId, muscle_group AS muscleGroup, weight
         FROM exercise_muscle_groups`,
        );
        return rows.map((row) => toDomain(row, allMg));
      })(),
    );
  }

  async findById(id: string): Promise<Result<Exercise | null>> {
    return toResult(
      (async () => {
        const rows = await this.sqlite.getAllAsync<any>(
          `SELECT id, name, equipment,
              is_bodyweight AS isBodyweight,
              is_custom AS isCustom,
              image_path AS imagePath,
              created_at AS createdAt
         FROM exercises WHERE id = ?`,
          [id],
        );
        const row = rows[0];
        if (!row) return null;
        const mg = await this.sqlite.getAllAsync<any>(
          `SELECT exercise_id AS exerciseId, muscle_group AS muscleGroup, weight
         FROM exercise_muscle_groups WHERE exercise_id = ?`,
          [id],
        );
        return toDomain(row, mg);
      })(),
    );
  }

  async create(exercise: Omit<Exercise, 'createdAt'>): Promise<Result<void>> {
    return toResult(
      (async () => {
        const now = Date.now();
        await this.sqlite.runAsync(
          'INSERT INTO exercises (id, name, equipment, is_bodyweight, is_custom, image_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            exercise.id,
            exercise.name,
            exercise.equipment,
            exercise.isBodyweight ? 1 : 0,
            exercise.isCustom ? 1 : 0,
            exercise.imagePath ?? null,
            now,
          ],
        );
        for (const mg of exercise.muscleGroups) {
          await this.sqlite.runAsync(
            'INSERT INTO exercise_muscle_groups (exercise_id, muscle_group, weight) VALUES (?, ?, ?)',
            [exercise.id, mg.group, mg.weight],
          );
        }
      })(),
    );
  }
}

function toDomain(row: any, allMuscleGroups: any[]): Exercise {
  const getVal = (obj: any, key: string) => obj[key] ?? obj[key.toLowerCase()];

  const rowId = row.id ?? row.ID;
  const createdAt = getVal(row, 'createdAt');
  const isBodyweight = getVal(row, 'isBodyweight');
  const isCustom = getVal(row, 'isCustom');
  const imagePath = getVal(row, 'imagePath');

  return {
    id: rowId,
    name: row.name ?? row.NAME,
    equipment: row.equipment ?? row.EQUIPMENT,
    isBodyweight: Boolean(isBodyweight),
    isCustom: Boolean(isCustom),
    imagePath: imagePath ?? null,
    createdAt: new Date(createdAt ?? Date.now()),
    muscleGroups: allMuscleGroups
      .filter((mg) => getVal(mg, 'exerciseId') === rowId)
      .map((mg) => ({
        group: getVal(mg, 'muscleGroup'),
        weight: mg.weight ?? mg.WEIGHT,
      })),
  };
}
