// Sistema de progresión del usuario — niveles, XP y "tier".
//
// Por qué vive en achievements/ y no en user/:
//   La progresión es una mecánica de gamification, parte del mismo dominio
//   conceptual que los badges. user/ representa la identidad/datos
//   personales del usuario; achievements/ representa cómo el sistema
//   reconoce su esfuerzo (badges + niveles + récords). Acopla aquí.
//
// Estado actual (Fase 1):
//   Las funciones devuelven valores derivados de datos que aún no existen
//   (sesiones, volumen, PRs). Hoy todas reciben 0 → todo arranca en mínimos.
//   Cuando workouts/sets vivan, alimentan estos cálculos.

// Tiers de progresión. El usuario sube cuando cruza el threshold de sesiones.
// Inspiración: League of Legends ranks. Comunican posición sin abrumar.
export type ProgressionTier =
  | 'Principiante'
  | 'Aprendiz'
  | 'Intermedio'
  | 'Avanzado'
  | 'Experto'
  | 'Maestro';

// Ordenadas de mayor a menor — al iterar paramos en el primero cuyo
// `min` se cumpla.
const TIER_THRESHOLDS: { tier: ProgressionTier; min: number }[] = [
  { tier: 'Maestro', min: 500 },
  { tier: 'Experto', min: 250 },
  { tier: 'Avanzado', min: 100 },
  { tier: 'Intermedio', min: 50 },
  { tier: 'Aprendiz', min: 10 },
  { tier: 'Principiante', min: 0 },
];

export function tierForSessions(sessions: number): ProgressionTier {
  for (const t of TIER_THRESHOLDS) {
    if (sessions >= t.min) return t.tier;
  }
  return 'Principiante';
}

// XP y niveles.
//
// Modelo simple: cada sesión = 50 XP. Cada nivel requiere `level * 100 XP`
// acumulados (curva lineal — Fase 2 la haremos exponencial cuando tenga
// más sentido balancear).
//
//   Nivel 1: 0-99 XP    (0% siempre arranca aquí)
//   Nivel 2: 100-299    (necesita 200 XP en total para alcanzarlo)
//   Nivel 3: 300-599
//   ...
//
// Por ahora — sin sesiones — todos en nivel 1 con 0 XP.
export type LevelInfo = {
  level: number;
  currentXP: number; // XP dentro del nivel actual (no acumulado total)
  xpForNext: number; // XP necesario para completar este nivel
};

export function levelFromXP(totalXP: number): LevelInfo {
  // Resolver el nivel encontrando el primer threshold acumulado que no
  // se cumple. Iteramos hasta nivel 100 como sanity bound — nadie llega ahí.
  let cumulative = 0;
  for (let level = 1; level <= 100; level++) {
    const cost = level * 100;
    if (totalXP < cumulative + cost) {
      return {
        level,
        currentXP: totalXP - cumulative,
        xpForNext: cost,
      };
    }
    cumulative += cost;
  }
  // Fallback teórico — Player gilipollas levantando como Cosmin.
  return { level: 100, currentXP: 0, xpForNext: 100 };
}

// Username público derivado del displayName.
// Reglas:
//   - null/empty → "@usuario"
//   - "Javier Alcate" → "@javier"        (primer token, lowercase)
//   - "María José"   → "@maria"          (sin tildes)
//   - "X Æ A-12"     → "@x"              (sane, no símbolos raros)
//
// Cuando llegue Fase 2 con auth/Google, el username puede venir del
// proveedor (gmail = jalcate@…) y guardarse explícitamente en
// UserProfile. Hasta entonces, derivamos.
export function usernameFromDisplayName(displayName: string | null): string {
  if (!displayName) return '@usuario';
  const first = displayName.trim().split(/\s+/)[0] ?? '';
  if (!first) return '@usuario';
  // Quitar tildes/diacríticos y limitar a alphanum.
  const normalized = first
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/[^a-z0-9]/g, '');
  return `@${normalized || 'usuario'}`;
}
