import {
  type PrimaryMuscleGroup,
  groupForMuscleId,
} from '@/features/body-map/domain/muscle-group-map';
// Importamos sólo los DATOS desde el entry point principal. La clase
// `BodyChart` (DOM-only) NO se referencia, así que el bundler debería
// tree-shaking quitarla (`sideEffects: false` en el package.json de la lib).
// Si en algún momento Metro deja restos, valoramos copiar los datos al repo.
import { BACK_MUSCLES, FRONT_MUSCLES, type MuscleDef } from 'body-muscles';
import { useMemo } from 'react';
import { Platform } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

// BodyMap — renderiza el SVG del cuerpo humano (anterior o posterior),
// coloreando cada músculo según el grupo al que pertenezca y el "color
// semántico" que la app le asigne.
//
// Por qué construido a mano con react-native-svg (no via `body-muscles/BodyChart`):
//   `BodyChart` es DOM-only (usa `document.createElement`). En RN nativo
//   no existe `document`. Importamos sólo los datos (paths, IDs) — el
//   módulo `body-muscles/dist/data` es DOM-free — y los pintamos con
//   `react-native-svg`, que SÍ funciona en native + web. Mismo resultado
//   visual, código portable.
//
// ViewBox heredado de body-muscles:
//   FRONT: "0 0 35 93"
//   BACK:  "37 0 35 93"
//   Ambas vistas comparten el mismo lienzo de 72×93 pero ocupan mitades
//   distintas. Cuando seleccionamos una sola vista, recortamos via viewBox.
//
// Comportamiento de tap:
//   onPressGroup recibe el GRUPO PLANO (pecho/espalda/etc), NO el id
//   anatómico detallado. Esto encaja con la granularidad de Fase 1 — el
//   usuario piensa en grupos, no en "lateral cabeza tricipital".
//
// Músculos NO clasificados (cabeza, manos, pies, codos, espina):
//   Se pintan en color neutral y son no tappables.

export type ViewSide = 'FRONT' | 'BACK';

// Mapa grupo → color de fill. La UI lo construye según la lógica de balance,
// "intensity heatmap" tras una sesión, o lo que sea. El BodyMap solo pinta.
export type GroupColors = Partial<Record<PrimaryMuscleGroup, string>>;

type BodyMapProps = {
  view: ViewSide;
  // Color por grupo. Grupo sin entrada → color por defecto.
  colors?: GroupColors;
  // Color de los músculos clasificados pero sin color custom.
  defaultColor?: string;
  // Color para músculos NO clasificados (cabeza, manos, …)
  neutralColor?: string;
  // Tap sobre un músculo de un grupo conocido → callback con el grupo.
  onPressGroup?: (group: PrimaryMuscleGroup) => void;
  // Sizing — el componente se adapta. Mantén el aspect ratio o usa width
  // dejando height en `undefined` (RN/SVG lo computa via viewBox).
  width?: number;
  height?: number;
};

const VIEW_BOXES: Record<ViewSide, string> = {
  FRONT: '0 0 35 93',
  BACK: '37 0 35 93',
};

export function BodyMap({
  view,
  colors,
  defaultColor = '#3A3A3A',
  neutralColor = '#252525',
  onPressGroup,
  width,
  height,
}: BodyMapProps) {
  // Slice de músculos a pintar según vista.
  const muscles: MuscleDef[] = view === 'FRONT' ? FRONT_MUSCLES : BACK_MUSCLES;

  // Pre-compute fill por músculo (memoized — recomputar solo cuando
  // cambia el mapeo de colores o la vista).
  const fillPerMuscle = useMemo(() => {
    const out: Record<string, string> = {};
    for (const m of muscles) {
      const group = groupForMuscleId(m.id);
      if (!group) {
        out[m.id] = neutralColor;
        continue;
      }
      out[m.id] = colors?.[group] ?? defaultColor;
    }
    return out;
  }, [muscles, colors, defaultColor, neutralColor]);

  return (
    <Svg viewBox={VIEW_BOXES[view]} width={width ?? '100%'} height={height ?? '100%'}>
      <G>
        {muscles.map((m) => {
          const group = groupForMuscleId(m.id);
          const handlePress = onPressGroup && group ? () => onPressGroup(group) : undefined;

          // React Native SVG en Web inyecta props de responder (onResponderTerminate, etc)
          // que el DOM no reconoce cuando se usa `onPress`. Para evitar warnings,
          // usamos `onClick` directamente en web.
          const interactionProps =
            Platform.OS === 'web' ? { onClick: handlePress } : { onPress: handlePress };

          return (
            <Path
              key={m.id}
              d={m.path}
              fill={fillPerMuscle[m.id]}
              stroke="#0A0A0A"
              strokeWidth={0.08}
              {...interactionProps}
            />
          );
        })}
      </G>
    </Svg>
  );
}
