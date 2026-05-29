import * as exercisesSchema from '@/features/exercises/adapters/schema';
import * as routinesSchema from '@/features/routines/adapters/schema';
import * as schedulingSchema from '@/features/scheduling/adapters/schema';
import * as userSchema from '@/features/user/adapters/schema';
import * as workoutsSchema from '@/features/workouts/adapters/schema';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import migrations from '../../drizzle/migrations/migrations';

// Catálogo combinado de tablas — necesario para que Drizzle infiera tipos al
// hacer queries. NO contiene una instancia de DB: solo los schemas.
//
// La instancia viva (Drizzle envuelto sobre SQLite) la crea `db-provider.tsx`
// dentro del árbol React, una vez que SQLiteProvider ha abierto la DB de forma
// async-safe (necesario para que la versión web no se cuelgue al arrancar).
export const schema = {
  ...exercisesSchema,
  ...routinesSchema,
  ...schedulingSchema,
  ...userSchema,
  ...workoutsSchema,
};

export { migrations };

// Tipo del Drizzle db que se inyecta por contexto. Lo usan adapters y use-cases
// que reciben el `db` como argumento — por ejemplo
// `class DrizzleSqliteExerciseRepo { constructor(db: Db) {...} }`.
export type Db = ExpoSQLiteDatabase<typeof schema>;
