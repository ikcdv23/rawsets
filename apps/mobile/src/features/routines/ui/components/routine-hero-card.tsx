import { RadialGlow } from '@/components/ui/radial-glow';
import { Text, View } from 'react-native';

// Hero card del detalle de rutina: badge coloreado con letra + nombre +
// meta resumida (grupos musculares · N ejercicios · duración estimada).
//
// Mismo esquema de color que `RoutineCard` (lima/ámbar/teal según letra inicial)
// para que la identidad visual se mantenga entre lista → detalle.
const ROUTINE_COLORS = {
  lime: '#A8E055',
  amber: '#F5C24E',
  teal: '#5DD6C8',
} as const;

function colorForName(name: string): string {
  const ch = name.trim().slice(0, 1).toUpperCase();
  if (ch === 'E') return ROUTINE_COLORS.amber;
  if (ch === 'P') return ROUTINE_COLORS.teal;
  return ROUTINE_COLORS.lime;
}

function initialOf(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || '·';
}

export type RoutineHeroCardProps = {
  name: string;
  muscleSummary: string; // "Espalda · Bíceps"
  exerciseCount: number;
  estimatedMinutes: number | null;
};

export function RoutineHeroCard({
  name,
  muscleSummary,
  exerciseCount,
  estimatedMinutes,
}: RoutineHeroCardProps) {
  const color = colorForName(name);
  const letter = initialOf(name);

  const metaParts = [
    muscleSummary || null,
    exerciseCount > 0
      ? `${exerciseCount} ejercicio${exerciseCount === 1 ? '' : 's'}`
      : 'Sin ejercicios',
    estimatedMinutes !== null ? `~${estimatedMinutes} min` : null,
  ].filter(Boolean) as string[];

  return (
    <View
      className="relative overflow-hidden rounded-[24px] border border-border p-5"
      style={{ backgroundColor: '#141414' }}
    >
      {/* Glow lima sutil en la esquina superior derecha — replica el detalle
          visual del mockup. `overflow-hidden` del contenedor lo recorta a la
          forma del card; `pointerEvents=none` lo deja pasar taps por debajo. */}
      <View className="pointer-events-none absolute -right-12 -top-12">
        <RadialGlow size={220} color={color} opacity={0.22} />
      </View>

      <View
        className="h-14 w-14 items-center justify-center rounded-[14px]"
        style={{ backgroundColor: `${color}1A`, borderWidth: 1, borderColor: `${color}55` }}
      >
        <Text className="font-sans-black text-[24px]" style={{ color, letterSpacing: -0.5 }}>
          {letter}
          <Text style={{ color }}>.</Text>
        </Text>
      </View>

      <Text
        className="mt-4 font-sans-black text-[32px] tracking-[-0.7px] text-foreground"
        numberOfLines={2}
      >
        {name}
      </Text>

      {metaParts.length > 0 ? (
        <Text className="mt-1 font-sans-medium text-[13px] text-muted">
          {metaParts.join(' · ')}
        </Text>
      ) : null}
    </View>
  );
}
