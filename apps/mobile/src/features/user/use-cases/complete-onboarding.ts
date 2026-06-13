import { type Result, err, ok } from '@/shared/result';
import type { UserProfile } from '../domain/user-profile';
import type { UserProfileRepo } from '../ports/user-profile-repo';

// Sello atómico de "ya pasó por el onboarding".
//
// Diferencia clave con `updateProfile`: ese parchea cualquier campo del perfil.
// Este SOLO marca `onboardedAt = now`. Si la UI necesita escribir un campo a
// mitad del flow (lo hacemos en cada step), usa `updateProfile` directamente.
// Este use case existe únicamente para sellar el cierre del onboarding y dejar
// la semántica clara: "este perfil ya cruzó la puerta".
//
// Por qué dedicado: cuando llegue Fase 2 con sync, este es el punto natural
// para lanzar el bootstrap remoto ("perfil onboarded localmente, intenta
// enlazar con cuenta sincronizada"). Sin un use case dedicado tendría que
// detectarse desde un parche genérico — frágil.
export async function completeOnboarding(repo: UserProfileRepo): Promise<Result<UserProfile>> {
  const currentResult = await repo.get();
  if (!currentResult.ok) return currentResult;

  const current = currentResult.value;
  if (!current) {
    return err(
      new Error('completeOnboarding: el perfil no existe. Llama a getOrCreateProfile primero.'),
    );
  }
  if (current.onboardedAt !== null) {
    // Idempotente — si ya estaba sellado, devuelvo el perfil actual sin tocar.
    return ok(current);
  }
  const next: UserProfile = { ...current, onboardedAt: new Date() };
  const upsertResult = await repo.upsert(next);
  if (!upsertResult.ok) return upsertResult;

  return ok(next);
}
