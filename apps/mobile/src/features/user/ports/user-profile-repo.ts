import type { UserProfile } from '../domain/user-profile';

// Port del repositorio de perfil. Métodos minimalistas para singleton:
//  - get(): devuelve la fila (o null si aún no se ha bootstrapped)
//  - upsert(): inserta o actualiza. Idempotente.
//
// No hay `delete` ni `list` — un singleton no tiene esas operaciones.
export type UserProfileRepo = {
  get(): Promise<UserProfile | null>;
  upsert(profile: UserProfile): Promise<void>;
};
