import type { Db } from '@/db/connection';
import { eq } from 'drizzle-orm';
import type { Exercise } from '../domain/exercise';
import type { ExerciseRepo } from '../ports/exercise-repo';
import { exerciseMuscleGroups, exercises } from './schema';

// Adapter Drizzle del puerto ExerciseRepo. La única pieza del slice que sabe
// que detrás hay SQLite. Si mañana cambias de motor, esta clase se sustituye
// y nadie más se entera.
//
// Sobre el groupBy manual: SQLite no tiene json_agg. Hacemos dos selects y
// agrupamos en memoria. Para catálogos chicos (~100 ejercicios) es trivial
// y más legible que un join + reduce.
export class DrizzleSqliteExerciseRepo implements ExerciseRepo {
  constructor(private readonly db: Db) {}

  async list(): Promise<Exercise[]> {
    const rows = await this.db.select().from(exercises);
    const allMg = await this.db.select().from(exerciseMuscleGroups);
    return rows.map((row) => toDomain(row, allMg));
  }

  async findById(id: string): Promise<Exercise | null> {
    const rows = await this.db.select().from(exercises).where(eq(exercises.id, id));
    const row = rows[0];
    if (!row) return null;
    const mg = await this.db
      .select()
      .from(exerciseMuscleGroups)
      .where(eq(exerciseMuscleGroups.exerciseId, id));
    return toDomain(row, mg);
  }

  async create(exercise: Omit<Exercise, 'createdAt'>): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(exercises).values({
        id: exercise.id,
        name: exercise.name,
        equipment: exercise.equipment,
        isBodyweight: exercise.isBodyweight,
        isCustom: exercise.isCustom,
        createdAt: new Date(),
      });
      if (exercise.muscleGroups.length > 0) {
        await tx.insert(exerciseMuscleGroups).values(
          exercise.muscleGroups.map((mg) => ({
            exerciseId: exercise.id,
            muscleGroup: mg.group,
            weight: mg.weight,
          })),
        );
      }
    });
  }
}

type ExerciseRow = typeof exercises.$inferSelect;
type MuscleGroupRow = typeof exerciseMuscleGroups.$inferSelect;

function toDomain(row: ExerciseRow, allMuscleGroups: MuscleGroupRow[]): Exercise {
  return {
    id: row.id,
    name: row.name,
    equipment: row.equipment,
    isBodyweight: row.isBodyweight,
    isCustom: row.isCustom,
    muscleGroups: allMuscleGroups
      .filter((mg) => mg.exerciseId === row.id)
      .map((mg) => ({ group: mg.muscleGroup, weight: mg.weight })),
    createdAt: row.createdAt,
  };
}
