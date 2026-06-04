import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { RadialGlow } from './radial-glow';

/**
 * Card — contenedor base (la "superficie" sobre el fondo).
 *
 * Por defecto: caja con fondo, borde y esquinas redondeadas.
 *
 * Opt-in `glow`: añade un blob radial lima en la esquina superior derecha,
 * recortado por overflow-hidden. Replica el detalle de los mockups donde
 * algunas cards tienen "luz cayendo por una esquina". Por defecto OFF —
 * solo se enciende en cards heroe (radar, hero de rutina, etc.) para que
 * el efecto no pierda fuerza por repetición.
 *
 *   glow         → boolean (default lima) o color hex string
 *   glowOpacity  → 0..1, por defecto 0.18
 *   glowPosition → 'tr' (default), 'tl', 'center'
 */
type GlowPosition = 'tr' | 'tl' | 'center';

type CardProps = {
  children: ReactNode;
  className?: string;
  glow?: boolean | string;
  glowOpacity?: number;
  glowPosition?: GlowPosition;
} & Omit<ViewProps, 'style'>;

const GLOW_SIZE = 220;

// Offset de la esquina para que el glow asome por fuera y se recorte con el
// `overflow-hidden` del card → da sensación de "luz que entra de fuera".
const GLOW_OFFSET = -48;

export function Card({
  children,
  className,
  glow,
  glowOpacity = 0.18,
  glowPosition = 'tr',
  ...rest
}: CardProps) {
  const hasGlow = glow === true || typeof glow === 'string';
  const glowColor = typeof glow === 'string' ? glow : '#A8E055';

  return (
    <View
      className={[
        'overflow-hidden rounded-3xl border border-border bg-surface p-5',
        className ?? '',
      ].join(' ')}
      {...rest}
    >
      {hasGlow ? (
        <View
          pointerEvents="none"
          style={[
            { position: 'absolute' },
            glowPosition === 'tr' && { top: GLOW_OFFSET, right: GLOW_OFFSET },
            glowPosition === 'tl' && { top: GLOW_OFFSET, left: GLOW_OFFSET },
            glowPosition === 'center' && {
              top: -GLOW_SIZE / 4,
              left: '50%',
              marginLeft: -GLOW_SIZE / 2,
            },
          ]}
        >
          <RadialGlow size={GLOW_SIZE} color={glowColor} opacity={glowOpacity} />
        </View>
      ) : null}
      {children}
    </View>
  );
}
