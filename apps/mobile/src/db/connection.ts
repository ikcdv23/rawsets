import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';

import * as exercisesSchema from '@/features/exercises/adapters/schema';
import * as routinesSchema from '@/features/routines/adapters/schema';
import * as workoutsSchema from '@/features/shceduling/adapters/schema';

const sqlite = SQLite.openDatabaseSync('rawsets.db');

export const db = drizzle(sqlite, {
  schema: {
    ...exercisesSchema,
    ...routinesSchema,
    ...workoutsSchema,
  },
});

export type Db = typeof db;
