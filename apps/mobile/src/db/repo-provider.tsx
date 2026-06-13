import { DrizzleSqliteExerciseRepo } from '@/features/exercises/adapters/drizzle-sqlite-exercise-repo';
import type { ExerciseRepo } from '@/features/exercises/ports/exercise-repo';
import { DrizzleSqliteRoutineRepo } from '@/features/routines/adapters/drizzle-sqlite-routine-repo';
import type { RoutineRepo } from '@/features/routines/ports/routine-repo';
import { DrizzleSqliteScheduledSessionRepo } from '@/features/scheduling/adapters/drizzle-sqlite-scheduled-session-repo';
import type { ScheduledSessionRepo } from '@/features/scheduling/ports/scheduled-session-repo';
import { DrizzleSqliteUserProfileRepo } from '@/features/user/adapters/drizzle-sqlite-user-profile-repo';
import type { UserProfileRepo } from '@/features/user/ports/user-profile-repo';
import { DrizzleSqliteWorkoutRepo } from '@/features/workouts/adapters/drizzle-sqlite-workout-repo';
import type { WorkoutRepo } from '@/features/workouts/ports/workout-repo';
import { type ReactNode, createContext, useContext, useMemo } from 'react';
import { useDb } from './db-provider';

export type Repos = {
  workout: WorkoutRepo;
  exercise: ExerciseRepo;
  routine: RoutineRepo;
  schedule: ScheduledSessionRepo;
  user: UserProfileRepo;
};

const RepoContext = createContext<Repos | null>(null);

export function useRepos(): Repos {
  const repos = useContext(RepoContext);
  if (!repos) {
    throw new Error('useRepos() debe usarse dentro de <RepoProvider>.');
  }
  return repos;
}

export function RepoProvider({ children }: { children: ReactNode }) {
  const { db, sqlite } = useDb();

  const repos = useMemo<Repos>(
    () => ({
      workout: new DrizzleSqliteWorkoutRepo(db, sqlite),
      exercise: new DrizzleSqliteExerciseRepo(db, sqlite),
      routine: new DrizzleSqliteRoutineRepo(db, sqlite),
      schedule: new DrizzleSqliteScheduledSessionRepo(db, sqlite),
      user: new DrizzleSqliteUserProfileRepo(db, sqlite),
    }),
    [db, sqlite],
  );

  return <RepoContext.Provider value={repos}>{children}</RepoContext.Provider>;
}
