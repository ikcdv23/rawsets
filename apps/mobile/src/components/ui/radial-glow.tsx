import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

// Blob de luz radial — gradient suave que se difumina hasta transparente.
// Replica los `radial-gradient` de los mockups (ver `.calendar::before` etc.)
// usando SVG en vez de CSS, así funciona en web + nativo igual.
//
// Uso típico: como hijo absolute-positioned dentro de una Card para añadir
// un brillo en una esquina sin teñir todo el fondo.
//
// Props:
//   size      → tamaño del SVG en px (el blob ocupa todo el cuadrado)
//   color     → color del centro (hex sin alpha — el alpha va en opacity)
//   opacity   → alpha del centro 0..1, el borde siempre va a 0
//   pointerEvents → "none" por defecto para que NO bloquee taps detrás
export type RadialGlowProps = {
  size: number;
  color?: string;
  opacity?: number;
};

export function RadialGlow({ size, color = '#A8E055', opacity = 0.18 }: RadialGlowProps) {
  // ID único-ish para que múltiples glows en la misma página no se pisen.
  // Math.random() está prohibido por el harness; usamos size+color como
  // discriminador "suficiente" — colisiones reales improbables.
  const id = `glow-${size}-${color.replace('#', '')}`;
  return (
    <Svg width={size} height={size} pointerEvents="none">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width={size} height={size} fill={`url(#${id})`} />
    </Svg>
  );
}
