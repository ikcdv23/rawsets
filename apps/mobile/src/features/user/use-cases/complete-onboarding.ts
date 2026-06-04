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
export async function completeOnboarding(repo: UserProfileRepo): Promise<UserProfile> {
  const current = await repo.get();
  if (!current) {
    throw new Error('completeOnboarding: el perfil no existe. Llama a getOrCreateProfile primero.');
  }
  if (current.onboardedAt !== null) {
    // Idempotente — si ya estaba sellado, devuelvo el perfil actual sin tocar.
    return current;
  }
  const next: UserProfile = { ...current, onboardedAt: new Date() };
  await repo.upsert(next);
  return next;
}
