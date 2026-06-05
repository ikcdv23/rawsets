export type SetLog = {
  reps: number;
  weight: number;
  done: boolean;
};

export type WorkoutExercise = {
  exerciseId: string;
  position: number;
  sets: SetLog[];
};

export type Workout = {
  id: string;
  startedAt: Date;
  finishedAt: Date | null;
  routineId: string | null;
  exercises: WorkoutExercise[];
};

export function workoutVolumeKg(workout: Workout): number {
  let v = 0;
  for (const ex of workout.exercises) {
    for (const s of ex.sets) {
      if (s.done) v += s.reps * s.weight;
    }
  }
  return v;
}

export function workoutDoneSetsCount(workout: Workout): number {
  return workout.exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.done).length, 0);
}

export function workoutDurationMs(workout: Workout): number | null {
  if (!workout.finishedAt) return null;
  return workout.finishedAt.getTime() - workout.startedAt.getTime();
}
