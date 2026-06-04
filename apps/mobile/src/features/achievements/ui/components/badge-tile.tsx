import type { Badge } from '@/features/achievements/domain/badge';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

// BadgeTile — versión refinada (v2).
//
// Cambios respecto a v1:
//   - Bordes más suaves (1px en vez de 2px en featured) para no competir
//     con los glows interiores
//   - Medallas con gradient de 3 paradas (highlight → base → sombra)
//     para dar volumen sin parecer botón 3D antiguo
//   - Shadow nativo bajo la medalla cuando está unlocked/featured —
//     "flota" sobre el tile
//   - Tile bg con gradient vertical (no diagonal) para evitar diagonales
//     compitiendo con la diagonal de la medalla
//   - Halo exterior lima más sutil en featured (-inset reducido y opacidad
//     menor) para que sea "respiración" en vez de borde-bis
//
// Estados:
//   locked    → tile dark plano, medalla gris con candado
//   unlocked  → tile con tinte lima sutil, medalla lima con shadow, glow
//               sutil arriba
//   featured  → tile con halo lima exterior + tinte interior, medalla
//               amber con shadow lima fuerte (cross-color = wow)
type BadgeTileProps = {
  badge: Badge;
  onPress: () => void;
};

// Gradients de medalla con 3 paradas: highlight top, base mid, depth bottom.
// Los matices son sutiles — no debe parecer un botón viejo de Windows.
const medalGradients: Record<Badge['state'], readonly [string, string, string]> = {
  locked: ['#252525', '#1A1A1A', '#101010'],
  unlocked: ['#C3F56E', '#A8E055', '#94CC44'],
  featured: ['#FFE08A', '#F5C24E', '#D9A736'],
};

// Tile background gradient — vertical, sutil. La variante featured tiene
// un toque lima muy leve mezclado en la parte superior.
const tileGradients: Record<Badge['state'], readonly [string, string]> = {
  locked: ['#1A1A1A', '#141414'],
  unlocked: ['#1E2018', '#141414'], // verde casi imperceptible arriba
  featured: ['#1E2018', '#141414'],
};

export function BadgeTile({ badge, onPress }: BadgeTileProps) {
  const isLocked = badge.state === 'locked';
  const isFeatured = badge.state === 'featured';
  const isUnlocked = badge.state === 'unlocked';

  const VisibleIcon = isLocked ? Lock : badge.icon;
  const displayName = badge.hidden && isLocked ? 'Secreto' : badge.name;
  const medalIconColor = isLocked ? '#9A9A9A' : '#0A0A0A';

  // Tile border — 1px en todos los estados, lo que cambia es la opacidad
  // del primary. Featured = más prominente sin caer en grosor "duro".
  const tileBorderClasses = isFeatured
    ? 'border border-primary/60'
    : isUnlocked
      ? 'border border-primary/25'
      : 'border border-border';

  // Sombra de la medalla — usada en unlocked/featured para que "flote".
  // featured tiene shadow LIMA aunque la medalla sea amber → cross-color
  // que comunica "este es ESPECIAL".
  const medalShadowStyle = isFeatured
    ? {
        shadowColor: '#A8E055',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 8,
      }
    : isUnlocked
      ? {
          shadowColor: '#A8E055',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.35,
          shadowRadius: 6,
          elevation: 4,
        }
      : {};

  return (
    <View className="relative">
      {/* Halo exterior lima — sólo featured. Más amplio y más sutil que v1. */}
      {isFeatured ? (
        <View pointerEvents="none" className="-inset-2 absolute rounded-3xl bg-primary/10" />
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Logro ${displayName}`}
        onPress={onPress}
        className={['overflow-hidden rounded-2xl active:opacity-80', tileBorderClasses].join(' ')}
      >
        <LinearGradient
          colors={tileGradients[badge.state]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            paddingHorizontal: 10,
            paddingTop: 16,
            paddingBottom: 14,
            alignItems: 'center',
          }}
        >
          {/* Glow interno arriba de la medalla — sólo no-locked. Da
              "iluminación de escenario" sobre la medalla. */}
          {!isLocked ? (
            <View
              pointerEvents="none"
              className="-top-8 absolute h-20 w-28 rounded-full bg-primary/15"
              style={{ alignSelf: 'center' }}
            />
          ) : null}

          {/* Medalla con shadow + gradient 3-stop. El shadow es nativo
              (iOS/Android); en web cae a CSS box-shadow vía react-native-web. */}
          <View style={medalShadowStyle}>
            <LinearGradient
              colors={medalGradients[badge.state]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                alignItems: 'center',
                justifyContent: 'center',
                // Borde sutil interior — perfila la silueta de la medalla
                // sin endurecerla.
                borderWidth: 1,
                borderColor: isLocked ? '#2A2A2A' : 'rgba(0,0,0,0.18)',
              }}
            >
              <VisibleIcon color={medalIconColor} size={22} strokeWidth={2.4} />
            </LinearGradient>
          </View>

          {/* Nombre */}
          <Text
            numberOfLines={2}
            className={[
              'mt-3 text-center font-sans-black text-[10.5px] leading-[14px] tracking-[-0.2px]',
              isLocked ? 'text-muted-dim' : 'text-foreground',
            ].join(' ')}
          >
            {displayName}
          </Text>

          {/* Progreso — sólo locked con target. Mono compacto. */}
          {isLocked && badge.progress ? (
            <Text className="mt-1.5 font-mono-bold text-[9px] tracking-[0.4px] text-muted">
              {badge.progress.current} / {badge.progress.target}
              {badge.progress.suffix ? ` ${badge.progress.suffix}` : ''}
            </Text>
          ) : null}
        </LinearGradient>
      </Pressable>
    </View>
  );
}
