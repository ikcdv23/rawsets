import { type Result, err, ok } from '@/shared/result';
import { type UserProfile, defaultUserProfile } from '../domain/user-profile';
import type { UserProfileRepo } from '../ports/user-profile-repo';

// Bootstrap del perfil. Si ya existe, devuelve. Si no, crea con valores
// por defecto (goal='general', unit='kg') y devuelve.
//
// Es el patrón "get-or-create" — idempotente. Se llama al arrancar la app
// (después de migrations) para asegurar que la fila `id='me'` exista antes
// de que cualquier otra feature la consulte.
export async function getOrCreateProfile(repo: UserProfileRepo): Promise<Result<UserProfile>> {
  const existingResult = await repo.get();
  if (!existingResult.ok) return existingResult;

  const existing = existingResult.value;
  if (existing) return ok(existing);

  const created = defaultUserProfile();
  const upsertResult = await repo.upsert(created);
  if (!upsertResult.ok) return upsertResult;

  return ok(created);
}
