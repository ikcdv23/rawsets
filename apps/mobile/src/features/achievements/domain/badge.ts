import type { LucideIcon } from 'lucide-react-native';

// Domain del slice achievements/.
//
// Por qué un slice propio (no `user/`): los badges son una mecánica de
// gamification con criterios que cruzan varios dominios (workouts, sets,
// streaks, balance score, scheduling…). Cuando llegue la lógica real,
// vivirá aquí, no manchando los otros slices.
//
// Estados visuales (mismos del mockup brand book):
//   locked    → bloqueado. Muestra contador de progreso (current / target).
//   unlocked  → conseguido. Medalla lima + glow sutil.
//   featured  → conseguido + destacado. Único en su tipo. Glow más fuerte
//               + ring amber. Reservado para hitos especiales (ej. el de
//               "¡Es más de 9000!" — la guinda del pastel).
export type BadgeState = 'locked' | 'unlocked' | 'featured';

export type Badge = {
  id: string;
  name: string;
  description: string;
  // Icono lucide que aparece en la medalla.
  icon: LucideIcon;
  state: BadgeState;
  // Sólo relevante cuando state === 'locked'. Objetivo numérico que el
  // usuario está persiguiendo (12/30 sesiones, 8/11 grupos equilibrados…).
  progress?: { current: number; target: number; suffix?: string };
  // Cuando true, el nombre se oculta hasta que el badge se desbloquea.
  // El usuario ve un "?" y "Secreto". Patrón clásico de games.
  hidden?: boolean;
  // Fecha de unlock. Por ahora siempre undefined; se setea cuando llegue
  // la lógica real de evaluación.
  unlockedAt?: Date;
};
