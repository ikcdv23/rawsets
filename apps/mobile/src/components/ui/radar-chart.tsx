import { View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

/**
 * RadarChart — gráfico de radar (hexágono) del balance muscular.
 *
 * Data-driven: le pasas un eje por grupo con su valor 0–100 y dibuja solo.
 * Es geometría: cada eje se reparte en círculo, y la distancia al centro
 * de cada vértice es proporcional a su valor.
 */
export type RadarAxis = {
  label: string;
  value: number; // 0–100
  flagged?: boolean; // true = punto débil (se pinta en rose)
};

type RadarChartProps = {
  data: RadarAxis[];
  size?: number; // lado del lienzo en px
  empty?: boolean; // si true, dibuja solo la rejilla (sin polígono ni vértices)
};

// Colores en hex: los props de SVG (fill/stroke) no aceptan clases NativeWind.
// Mantener en sintonía con los tokens de global.css.
const LIME = '#A8E055';
const ROSE = '#FF3B5C';
const GRID = 'rgba(255,255,255,0.06)';
const LABEL = '#8A8A8A';

export function RadarChart({ data, size = 260, empty = false }: RadarChartProps) {
  const n = data.length;
  const center = size / 2;
  const maxR = size / 2 - 34; // hueco para las etiquetas de fuera

  // Ángulo de cada eje: empieza arriba (-90°) y gira en sentido horario.
  const angleAt = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;

  // "x,y" del eje i a un radio dado.
  const at = (i: number, r: number) =>
    `${center + r * Math.cos(angleAt(i))},${center + r * Math.sin(angleAt(i))}`;

  // Anillo de escala: polígono regular a una fracción del radio máximo.
  const ring = (frac: number) => data.map((_, i) => at(i, maxR * frac)).join(' ');

  // Polígono de datos: cada vértice según su valor.
  const shape = data.map((a, i) => at(i, maxR * (a.value / 100))).join(' ');

  return (
    <View className="items-center">
      <Svg width={size} height={size}>
        {/* Anillos de escala 33 / 66 / 100% */}
        {[0.33, 0.66, 1].map((f) => (
          <Polygon key={f} points={ring(f)} fill="none" stroke={GRID} strokeWidth={1} />
        ))}

        {/* Ejes radiales */}
        {data.map((a, i) => (
          <Line
            key={a.label}
            x1={center}
            y1={center}
            x2={center + maxR * Math.cos(angleAt(i))}
            y2={center + maxR * Math.sin(angleAt(i))}
            stroke={GRID}
          />
        ))}

        {/* Polígono de datos (área + borde lima). Oculto en estado vacío. */}
        {!empty && (
          <Polygon points={shape} fill="rgba(168,224,85,0.18)" stroke={LIME} strokeWidth={2} />
        )}

        {/* Vértices. Oculto en estado vacío. */}
        {!empty &&
          data.map((a, i) => (
            <Circle
              key={a.label}
              cx={center + maxR * (a.value / 100) * Math.cos(angleAt(i))}
              cy={center + maxR * (a.value / 100) * Math.sin(angleAt(i))}
              r={a.flagged ? 4.5 : 3.5}
              fill={a.flagged ? ROSE : LIME}
            />
          ))}

        {/* Etiquetas + valor */}
        {data.map((a, i) => {
          const lx = center + (maxR + 16) * Math.cos(angleAt(i));
          const ly = center + (maxR + 16) * Math.sin(angleAt(i));
          return (
            <SvgText
              key={a.label}
              x={lx}
              y={ly}
              fill={!empty && a.flagged ? ROSE : LABEL}
              fontSize={9}
              fontWeight="800"
              textAnchor="middle"
            >
              {a.label.toUpperCase()}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
