import type { Badge } from '@/features/achievements/domain/badge';
import { Lock } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

// BadgeTile — versión minimalista (v3).
//
// Filosofía de esta iteración: lo mínimo que comunica los 3 estados.
// Sin gradients, sin shadows, sin halos, sin glows. La diferenciación
// se hace solo con:
//   - color sólido de la medalla
//   - grosor / color del borde de la tile
//
// Razón del cambio: las versiones anteriores acumulaban capas
// (gradient + shadow + border + glow + tint…) que en conjunto se sentían
// "trying too hard". Más capas ≠ más bonito. Menos vale más.
//
// Estados:
//   locked    → tile dark plano, sin border, medalla gris con candado
//   unlocked  → tile dark plano, sin border, medalla lima sólida
//   featured  → tile dark plano, 1px lima de borde, medalla lima sólida.
//               El borde sólo es lo único que distingue al "destacado".

type BadgeTileProps = {
  badge: Badge;
  onPress: () => void;
};

export function BadgeTile({ badge, onPress }: BadgeTileProps) {
  const isLocked = badge.state === 'locked';
  const isFeatured = badge.state === 'featured';

  const VisibleIcon = isLocked ? Lock : badge.icon;
  const displayName = badge.hidden && isLocked ? 'Secreto' : badge.name;

  // Una sola línea por decisión visual — sin objetos de variantes, sin
  // gradientes, sin shadows. Datos puros, render trivial.
  const medalBg = isLocked ? '#1A1A1A' : '#A8E055';
  const medalIconColor = isLocked ? '#5A5A5A' : '#0A0A0A';
  const medalBorder = isLocked ? '#2A2A2A' : 'transparent';

  const tileBorder = isFeatured ? 'border border-primary' : 'border border-transparent';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Logro ${displayName}`}
      onPress={onPress}
      className={[
        'items-center rounded-2xl bg-surface px-3 py-4 active:opacity-80',
        tileBorder,
      ].join(' ')}
    >
      <View
        className="h-12 w-12 items-center justify-center rounded-full"
        style={{
          backgroundColor: medalBg,
          borderWidth: isLocked ? 1 : 0,
          borderColor: medalBorder,
        }}
      >
        <VisibleIcon color={medalIconColor} size={20} strokeWidth={2.4} />
      </View>

      <Text
        numberOfLines={2}
        className={[
          'mt-3 text-center font-sans-bold text-[10.5px] leading-[14px] tracking-[-0.2px]',
          isLocked ? 'text-muted' : 'text-foreground',
        ].join(' ')}
      >
        {displayName}
      </Text>

      {isLocked && badge.progress ? (
        <Text className="mt-1 font-mono text-[9px] tracking-[0.4px] text-muted-dim">
          {badge.progress.current} / {badge.progress.target}
          {badge.progress.suffix ? ` ${badge.progress.suffix}` : ''}
        </Text>
      ) : null}
    </Pressable>
  );
}
