import type { Db } from '@/db/connection';
import type { MuscleGroup } from '@/features/exercises/domain/muscle-groups';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { SetLog, Workout, WorkoutExercise } from '../domain/workout';
import type {
  PreviousSetValue,
  StartWorkoutInput,
  UpdateSetInput,
  WorkoutRepo,
} from '../ports/workout-repo';

// Adapter de WorkoutRepo. Misma elección que routines: SQL crudo vía
// `getAllAsync` / `runAsync` en vez de Drizzle, por el bug del sync wrapper
// en wa-sqlite (web) que rompe payloads grandes. El handle `db` se conserva
// para el día que podamos volver a la ORM tipada sin reescribir consumers.
//
// Identidad sintética: cada fila de `sets` tiene `id` UUID propio, opaco al
// dominio. El dominio identifica un set por (workoutId, exerciseId, setNumber).
// Esa tupla no cambia durante la vida del workout — el id sólo importa al
// adapter para los WHERE de UPDATE.
export class DrizzleSqliteWorkoutRepo implements WorkoutRepo {
  constructor(
    private readonly _db: Db,
    private readonly sqlite: SQLiteDatabase,
  ) {}

  async startWorkout(input: StartWorkoutInput): Promise<void> {
    // INSERT workout + N*M placeholders. Lo envolvemos en una transacción
    // para que un crash a mitad no deje un workout huérfano sin sus sets.
    await this.sqlite.withTransactionAsync(async () => {
      await this.sqlite.runAsync(
        'INSERT INTO workouts (id, routine_id, started_at, finished_at, notes) VALUES (?, ?, ?, NULL, NULL)',
        [input.id, input.routineId, input.startedAt.getTime()],
      );
      for (const ex of input.exercises) {
        for (let setNumber = 1; setNumber <= ex.targetSets; setNumber++) {
          await this.sqlite.runAsync(
            `INSERT INTO sets
               (id, workout_id, exercise_id, position, set_number, weight, reps, done, completed_at, rpe, rest_seconds)
               VALUES (?, ?, ?, ?, ?, 0, 0, 0, NULL, NULL, NULL)`,
            [crypto.randomUUID(), input.id, ex.exerciseId, ex.position, setNumber],
          );
        }
      }
    });
  }

  async updateSet(input: UpdateSetInput): Promise<void> {
    // Si done pasa a true ahora, sellamos completed_at. Si pasa a false,
    // lo limpiamos — un toggle indeciso no debería dejar timestamp huérfano.
    const completedAt = input.done ? Date.now() : null;
    await this.sqlite.runAsync(
      `UPDATE sets
          SET weight = ?, reps = ?, done = ?, completed_at = ?
        WHERE workout_id = ? AND exercise_id = ? AND set_number = ?`,
      [
        input.weight,
        input.reps,
        input.done ? 1 : 0,
        completedAt,
        input.workoutId,
        input.exerciseId,
        input.setNumber,
      ],
    );
  }

  async finishWorkout(workoutId: string, finishedAt: Date): Promise<void> {
    await this.sqlite.runAsync('UPDATE workouts SET finished_at = ? WHERE id = ?', [
      finishedAt.getTime(),
      workoutId,
    ]);
  }

  async findActiveOrNull(): Promise<Workout | null> {
    const rows = await this.sqlite.getAllAsync<WorkoutRow>(
      `SELECT id, routine_id AS routineId, started_at AS startedAt, finished_at AS finishedAt
         FROM workouts
        WHERE finished_at IS NULL
        ORDER BY started_at DESC
        LIMIT 1`,
    );
    const row = rows[0];
    if (!row) return null;
    const setRows = await this.sqlite.getAllAsync<SetRow>(
      `SELECT exercise_id AS exerciseId, position, set_number AS setNumber, weight, reps, done
         FROM sets
        WHERE workout_id = ?
        ORDER BY position ASC, set_number ASC`,
      [row.id],
    );
    return toDomainWorkout(row, setRows);
  }

  async getPreviousSetValues(exerciseId: string): Promise<PreviousSetValue[]> {
    // El "anterior" es el último workout FINALIZADO que tenga sets done de
    // este ejercicio. Excluimos el activo (finished_at IS NULL) porque ese
    // ES el actual — la columna se llama "Previa", no "Esta".
    const rows = await this.sqlite.getAllAsync<{
      setNumber: number;
      weight: number;
      reps: number;
    }>(
      `SELECT s.set_number AS setNumber, s.weight, s.reps
         FROM sets s
        WHERE s.exercise_id = ?
          AND s.done = 1
          AND s.workout_id = (
            SELECT w.id
              FROM workouts w
              JOIN sets s2 ON s2.workout_id = w.id
             WHERE w.finished_at IS NOT NULL
               AND s2.exercise_id = ?
               AND s2.done = 1
             ORDER BY w.finished_at DESC
             LIMIT 1
          )
        ORDER BY s.set_number ASC`,
      [exerciseId, exerciseId],
    );
    return rows;
  }

  async aggregateMuscleVolumeInRange(
    from: Date,
    to: Date,
  ): Promise<Array<{ muscleGroup: MuscleGroup; volumeKg: number }>> {
    // SUM(reps * weight * contribution) — la contribución vive en
    // exercise_muscle_groups.weight (0..1). Press banca → pecho 0.7,
    // tríceps 0.2, hombro 0.1. Un set de 100kg × 10 reps "vale" 700kg
    // a pecho, 200kg a tríceps, 100kg a hombro.
    //
    // Rango semi-abierto [from, to) — el caller hace "últimos 14 días" con
    // from = hoy-14, to = ahora+1 para incluir el momento actual sin
    // pensar en floor/ceil.
    return this.sqlite.getAllAsync<{ muscleGroup: MuscleGroup; volumeKg: number }>(
      `SELECT emg.muscle_group AS muscleGroup,
              SUM(s.reps * s.weight * emg.weight) AS volumeKg
         FROM sets s
         JOIN workouts w ON w.id = s.workout_id
         JOIN exercise_muscle_groups emg ON emg.exercise_id = s.exercise_id
        WHERE s.done = 1
          AND s.weight > 0
          AND s.reps > 0
          AND w.started_at >= ?
          AND w.started_at < ?
        GROUP BY emg.muscle_group`,
      [from.getTime(), to.getTime()],
    );
  }
}

type WorkoutRow = {
  id: string;
  routineId: string | null;
  startedAt: number;
  finishedAt: number | null;
};

type SetRow = {
  exerciseId: string;
  position: number;
  setNumber: number;
  weight: number;
  reps: number;
  // SQLite devuelve 0/1 — Drizzle no está mapeando aquí porque vamos por raw.
  done: number;
};

function toDomainWorkout(row: WorkoutRow, setRows: SetRow[]): Workout {
  // Agrupar sets por exerciseId conservando el orden de aparición (que ya
  // viene por position ASC, set_number ASC desde la query).
  const byExercise = new Map<string, { position: number; sets: SetLog[] }>();
  for (const s of setRows) {
    let entry = byExercise.get(s.exerciseId);
    if (!entry) {
      entry = { position: s.position, sets: [] };
      byExercise.set(s.exerciseId, entry);
    }
    entry.sets.push({ reps: s.reps, weight: s.weight, done: s.done === 1 });
  }

  const exercises: WorkoutExercise[] = Array.from(byExercise.entries())
    .map(([exerciseId, { position, sets }]): WorkoutExercise => ({ exerciseId, position, sets }))
    .sort((a, b) => a.position - b.position);

  return {
    id: row.id,
    startedAt: new Date(row.startedAt),
    finishedAt: row.finishedAt ? new Date(row.finishedAt) : null,
    routineId: row.routineId,
    exercises,
  };
}
