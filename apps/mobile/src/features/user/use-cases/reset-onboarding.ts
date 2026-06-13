import { type Result, err, ok } from '@/shared/result';
import type { UserProfile } from '../domain/user-profile';
import type { UserProfileRepo } from '../ports/user-profile-repo';

// Inverso de `completeOnboarding`. Setea `onboardedAt = null` y NO toca
// nada más del perfil — el usuario conserva nombre/objetivo/etc, pero al
// próximo arranque la gate del `app/index.tsx` lo manda de vuelta a
// /welcome para que rehaga el flow.
//
// Uso típico:
//   - Profile → "Reiniciar onboarding" (dev / curiosity).
//   - Tests E2E.
//   - Bug recovery (rara vez).
export async function resetOnboarding(repo: UserProfileRepo): Promise<Result<UserProfile>> {
  const currentResult = await repo.get();
  if (!currentResult.ok) return currentResult;

  const current = currentResult.value;
  if (!current) {
    return err(new Error('resetOnboarding: no hay perfil. Estado inconsistente.'));
  }
  if (current.onboardedAt === null) {
    // Ya estaba sin sellar — idempotente.
    return ok(current);
  }
  const next: UserProfile = { ...current, onboardedAt: null };
  const upsertResult = await repo.upsert(next);
  if (!upsertResult.ok) return upsertResult;

  return ok(next);
}
