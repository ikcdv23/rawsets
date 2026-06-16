import type { Db } from '@/db/connection';
import { type Result, toResult } from '@/shared/result';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Goal, Sex, Unit, UserProfile } from '../domain/user-profile';
import type { UserProfileRepo } from '../ports/user-profile-repo';

// Adapter del UserProfileRepo singleton.
// IMPORTANTE: Usamos la API ASYNC de sqlite directamente (no Drizzle .select/.insert)
// porque en Web la API síncrona bloquea el Access Handle del sistema de archivos
// y provoca NoModificationAllowedError.
export class DrizzleSqliteUserProfileRepo implements UserProfileRepo {
  constructor(
    private readonly _db: Db,
    private readonly sqlite: SQLiteDatabase,
  ) {}

  async get(): Promise<Result<UserProfile | null>> {
    return toResult(
      (async () => {
        const rows = await this.sqlite.getAllAsync<any>(
          `SELECT id, display_name AS displayName, goal, unit,
              body_weight AS bodyWeight, birth_date AS birthDate, sex,
              created_at AS createdAt, onboarded_at AS onboardedAt
         FROM user_profile WHERE id = 'me'`,
        );
        const row = rows[0];
        if (!row) return null;

        return {
          id: 'me',
          displayName: row.displayName,
          goal: row.goal,
          unit: row.unit,
          bodyWeight: row.bodyWeight,
          birthDate: row.birthDate ? new Date(row.birthDate) : null,
          sex: row.sex,
          createdAt: new Date(row.createdAt),
          onboardedAt: row.onboardedAt ? new Date(row.onboardedAt) : null,
        };
      })(),
    );
  }

  async upsert(profile: UserProfile): Promise<Result<void>> {
    return toResult(
      (async () => {
        await this.sqlite.runAsync(
          `INSERT OR REPLACE INTO user_profile
       (id, display_name, goal, unit, body_weight, birth_date, sex, created_at, onboarded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            profile.id,
            profile.displayName,
            profile.goal,
            profile.unit,
            profile.bodyWeight,
            profile.birthDate instanceof Date ? profile.birthDate.getTime() : profile.birthDate,
            profile.sex,
            profile.createdAt instanceof Date ? profile.createdAt.getTime() : profile.createdAt,
            profile.onboardedAt instanceof Date ? profile.onboardedAt.getTime() : profile.onboardedAt,
          ],
        );
      })(),
    );
  }
}
