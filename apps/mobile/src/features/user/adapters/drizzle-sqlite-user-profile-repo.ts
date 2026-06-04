import type { Db } from '@/db/connection';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Goal, Sex, Unit, UserProfile } from '../domain/user-profile';
import type { UserProfileRepo } from '../ports/user-profile-repo';

// Adapter del UserProfileRepo singleton.
// SQL crudo por las mismas razones del resto: Drizzle usa la API sync de
// expo-sqlite que en web trunca buffers. Aquí los reads/writes son sobre una
// sola fila ('me'), trivial.
export class DrizzleSqliteUserProfileRepo implements UserProfileRepo {
  constructor(
    private readonly _db: Db,
    private readonly sqlite: SQLiteDatabase,
  ) {}

  async get(): Promise<UserProfile | null> {
    const rows = await this.sqlite.getAllAsync<UserProfileRow>(
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
  }

  async upsert(profile: UserProfile): Promise<void> {
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
        profile.birthDate ? profile.birthDate.getTime() : null,
        profile.sex,
        profile.createdAt.getTime(),
        profile.onboardedAt ? profile.onboardedAt.getTime() : null,
      ],
    );
  }
}

type UserProfileRow = {
  id: 'me';
  displayName: string | null;
  goal: Goal;
  unit: Unit;
  bodyWeight: number | null;
  birthDate: number | null;
  sex: Sex | null;
  createdAt: number;
  onboardedAt: number | null;
};
