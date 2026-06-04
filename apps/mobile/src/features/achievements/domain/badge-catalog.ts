import {
  Calendar,
  Dumbbell,
  Footprints,
  Hash,
  HelpCircle,
  Scale,
  Sunrise,
  TrendingUp,
  Zap,
} from 'lucide-react-native';
import type { Badge } from './badge';

// Catálogo HARDCODED de badges — UI shell.
//
// Cuando lleguen los slices de workouts/sets/scheduling/balance, esta lista
// se convierte en evaluación dinámica: una función que mira el estado del
// usuario y devuelve `Badge[]` con los `state` calculados.
//
// Mientras tanto: hardcoded con estados representativos del mockup. Los
// usuarios reales verán todo en 'locked' hasta que tengan datos — pero la
// UI ya soporta los tres estados visuales para no tener que tocarla luego.
//
// Mapeo a features que aún no existen:
//   "¡Es más de 9000!"  → volumen acumulado >= 9000kg              [sets]
//   "Club de los 100"   → 100 sesiones registradas                  [workouts]
//   "Primer paso"       → primera sesión completada                 [workouts]
//   "Constancia"        → racha de 30 días siguiendo el plan       [scheduling]
//   "Imparable"         → 30 sesiones en 30 días                   [workouts]
//   "Equilibrio"        → los 11 grupos musculares equilibrados    [balance]
//   "Madrugador"        → 10 sesiones antes de las 8am             [workouts]
//   "Media tonelada"    → 500kg en una sesión                       [sets]
//   "Secreto"           → ¿? (revelado al desbloquear)
export const BADGE_CATALOG: Badge[] = [
  {
    id: 'over-9000',
    name: '¡Es más de 9000!',
    description: 'Volumen acumulado superior a 9.000 kg. Vegeta estaría orgulloso.',
    icon: Zap,
    state: 'featured',
  },
  {
    id: 'club-100',
    name: 'Club de los 100',
    description: '100 sesiones completadas. Eres parte del club.',
    icon: Hash,
    state: 'unlocked',
  },
  {
    id: 'first-step',
    name: 'Primer paso',
    description: 'Tu primera sesión registrada. El viaje empieza aquí.',
    icon: Footprints,
    state: 'unlocked',
  },
  {
    id: 'iron-streak',
    name: 'Constancia de hierro',
    description: 'Racha de 30 días siguiendo el plan al pie de la letra.',
    icon: Calendar,
    state: 'unlocked',
  },
  {
    id: 'unstoppable',
    name: 'Imparable',
    description: '30 sesiones registradas en 30 días.',
    icon: TrendingUp,
    state: 'locked',
    progress: { current: 12, target: 30 },
  },
  {
    id: 'perfect-balance',
    name: 'Equilibrio perfecto',
    description: 'Los 11 grupos musculares dentro del umbral de balance.',
    icon: Scale,
    state: 'locked',
    progress: { current: 8, target: 11 },
  },
  {
    id: 'early-bird',
    name: 'Madrugador',
    description: '10 sesiones registradas antes de las 8 de la mañana.',
    icon: Sunrise,
    state: 'locked',
    progress: { current: 3, target: 10 },
  },
  {
    id: 'half-ton',
    name: 'Media tonelada',
    description: '500 kg de volumen en una sola sesión.',
    icon: Dumbbell,
    state: 'locked',
    progress: { current: 312, target: 500, suffix: 'kg' },
  },
  {
    id: 'secret',
    name: 'Secreto',
    description: 'Sigue entrenando para descubrirlo.',
    icon: HelpCircle,
    state: 'locked',
    hidden: true,
  },
];
