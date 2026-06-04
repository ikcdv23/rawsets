import Svg, { Circle, G, Line, Polygon, Rect } from 'react-native-svg';

// BrandIcon — isotipo "Balance Polygon" (v2.0 simétrico).
//
// Hexágono regular pointy-top centrado en (512, 512), radio 380.
// Espejo del SVG fuente: apps/mobile/assets/images/icon.svg.
type BrandIconProps = {
  size?: number; // lado en px, default 96
};

export function BrandIcon({ size = 96 }: BrandIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      {/* Squircle lima */}
      <Rect width="1024" height="1024" rx="232" ry="232" fill="#B8FA82" />

      {/* Hexágono regular (datos) */}
      <Polygon points="512,132 841,322 841,702 512,892 183,702 183,322" fill="#0A0A0A" />

      {/* Ejes radiales desde centro hacia cada vértice */}
      <G stroke="#B8FA82" strokeWidth="12" strokeLinecap="round">
        <Line x1="512" y1="512" x2="512" y2="132" />
        <Line x1="512" y1="512" x2="841" y2="322" />
        <Line x1="512" y1="512" x2="841" y2="702" />
        <Line x1="512" y1="512" x2="512" y2="892" />
        <Line x1="512" y1="512" x2="183" y2="702" />
        <Line x1="512" y1="512" x2="183" y2="322" />
      </G>

      {/* Nodos en los vértices */}
      <G fill="#B8FA82">
        <Circle cx="512" cy="132" r="30" />
        <Circle cx="841" cy="322" r="30" />
        <Circle cx="841" cy="702" r="30" />
        <Circle cx="512" cy="892" r="30" />
        <Circle cx="183" cy="702" r="30" />
        <Circle cx="183" cy="322" r="30" />
      </G>

      {/* Nodo central (origen del radar) */}
      <Circle cx="512" cy="512" r="22" fill="#B8FA82" />
    </Svg>
  );
}
