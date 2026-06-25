// Enums del perfil del usuario.
// Viven en domain/, NO en el schema Drizzle. Razón: el dominio no debe
// depender de la persistencia (Hexagonal). El schema importa estos arrays
// para tipar la columna; pero el código de negocio importa los TIPOS desde
// aquí.

export const GOALS = ['mass', 'strength', 'loss', 'maintenance', 'general'] as const;
export type Goal = (typeof GOALS)[number];

export const UNITS = ['kg', 'lb'] as const;
export type Unit = (typeof UNITS)[number];

export const SEXES = ['male', 'female', 'other'] as const;
export type Sex = (typeof SEXES)[number];

// Agregado UserProfile. Singleton: solo existe una fila, con id='me'.
// Ver ADR-0005 — la unicidad se garantiza desde el caso de uso al insertar
// (SQLite no soporta CHECK declarativo de "solo un valor permitido").
export type UserProfile = {
  id: 'me';
  displayName: string | null;
  goal: Goal;
  unit: Unit;
  bodyWeight: number | null;
  birthDate: Date | null;
  sex: Sex | null;
  createdAt: Date;
  // null = onboarding pendiente. Cuando se complete, sello la fecha aquí.
  // Sirve también para analytics de funnel.
  onboardedAt: Date | null;
};

// Constructor del perfil por defecto. Se usa en el bootstrap (primer arranque).
// Goal='general' y unit='kg' son los defaults declarados en el ADR.
export function defaultUserProfile(): UserProfile {
  return {
    id: 'me',
    displayName: null,
    goal: 'general',
    unit: 'kg',
    bodyWeight: null,
    birthDate: null,
    sex: null,
    createdAt: new Date(),
    onboardedAt: null,
  };
}

// Predicado puro — toda la app pregunta por esto.
// Ahora con fail-safe: si tiene onboardedAt O tiene displayName, asumimos que ya pasó
// el flujo inicial. Esto evita bucles infinitos si la persistencia del timestamp
// falla pero el resto de datos (como el nombre) sí se guardaron.
export function isOnboarded(profile: UserProfile): boolean {
  return profile.onboardedAt !== null || (profile.displayName !== null && profile.displayName.length > 0);
}

// Deriva iniciales para el AvatarIcon a partir del displayName.
// - null / vacío → "?"
// - "Javier" → "J"
// - "Javier Alcate" (2+ palabras) → "JA" (primera letra de las 2 primeras)
export function initialsFromName(displayName: string | null): string {
  if (!displayName) return '?';
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const letters = parts
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('');
  return letters.toUpperCase() || '?';
}

// --- HELPERS DE DOMINIO ---

/**
 * Calcula la edad en años desde una fecha de nacimiento.
 */
export function calculateAge(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  // Si el cumpleaños aún no ha llegado este año, restamos uno.
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Convierte el peso (siempre almacenado en kg) a la unidad deseada y lo formatea.
 * Incluye defensa contra valores nulos o indefinidos para evitar crashes.
 */
export function formatWeight(kg: number | null | undefined, unit: Unit): string {
  if (kg === null || kg === undefined || Number.isNaN(kg)) return '—';
  const value = unit === 'lb' ? kg * 2.20462 : kg;
  // Una decimal, sin trailing zeros sucios.
  return value.toFixed(1).replace(/\.0$/, '');
}
