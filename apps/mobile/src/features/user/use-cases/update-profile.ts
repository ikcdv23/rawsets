import { type Result, err, ok } from '@/shared/result';
import type { UserProfile } from '../domain/user-profile';
import type { UserProfileRepo } from '../ports/user-profile-repo';

// Patch parcial del perfil. La UI envía un objeto con solo los campos que
// quiere cambiar. El use case lee el actual, aplica el patch, valida y guarda.
export type UpdateProfileInput = Partial<
  Pick<UserProfile, 'displayName' | 'goal' | 'unit' | 'bodyWeight' | 'birthDate' | 'sex'>
>;

export async function updateProfile(
  repo: UserProfileRepo,
  patch: UpdateProfileInput,
): Promise<Result<UserProfile>> {
  const currentResult = await repo.get();
  if (!currentResult.ok) return currentResult;

  const current = currentResult.value;
  if (!current) {
    return err(
      new Error(
        'updateProfile: el perfil no existe. Llama a getOrCreateProfile primero (típicamente en el bootstrap de la app).',
      ),
    );
  }

  // Validaciones del dominio.
  if (patch.bodyWeight !== undefined && patch.bodyWeight !== null && patch.bodyWeight <= 0) {
    return err(new Error('bodyWeight debe ser > 0 kg.'));
  }
  if (patch.displayName !== undefined && patch.displayName !== null) {
    const trimmed = patch.displayName.trim();
    if (trimmed.length === 0) {
      // El usuario "borró" su nombre — guarda null en vez de "".
      patch.displayName = null;
    } else {
      patch.displayName = trimmed;
    }
  }

  const next: UserProfile = { ...current, ...patch };
  const upsertResult = await repo.upsert(next);
  if (!upsertResult.ok) return upsertResult;

  return ok(next);
}
