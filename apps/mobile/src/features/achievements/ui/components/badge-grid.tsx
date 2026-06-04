import type { Badge } from '@/features/achievements/domain/badge';
import { View } from 'react-native';
import { BadgeTile } from './badge-tile';

// Grid 3 columnas exactas — espejo del mockup brand book §profile.
//
// Por qué NO uso `flex-wrap` con width fija (en %, en px, etc.):
//   Cuando el contenedor cambia de ancho (orientación, web responsive,
//   tablet…), el flex-wrap puede colapsar a 2 columnas si el gap absoluto
//   en pixels gana porcentaje. Es frágil.
//
// El patrón robusto: agrupar badges en chunks de 3, renderizar cada chunk
// como una FILA con `flex-1` en cada celda. Cada fila reparte el ancho
// disponible entre sus elementos, restando el gap automáticamente.
//
// Si el array no es múltiplo de 3, la última fila se rellena con celdas
// vacías de `flex-1` para que los tiles del final mantengan el mismo
// ancho que los del resto. Así NO crecen hasta llenar la fila.
const COLUMNS = 3;

type BadgeGridProps = {
  badges: Badge[];
  onPressBadge: (badge: Badge) => void;
};

export function BadgeGrid({ badges, onPressBadge }: BadgeGridProps) {
  const rows = chunk(badges, COLUMNS);

  return (
    <View className="gap-3">
      {rows.map((row, rowIdx) => (
        // key estable basada en los ids de la fila — evita reorder
        // weirdness si las posiciones cambian en el futuro.
        <View key={row.map((b) => b.id).join('-')} className="flex-row gap-3">
          {row.map((badge) => (
            <View key={badge.id} className="flex-1">
              <BadgeTile badge={badge} onPress={() => onPressBadge(badge)} />
            </View>
          ))}
          {/* Celdas vacías para preservar tile-width en la última fila
              cuando no es múltiplo de COLUMNS. */}
          {row.length < COLUMNS
            ? Array.from({ length: COLUMNS - row.length }).map((_, idx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: padding cells no reorder
                <View key={`pad-${rowIdx}-${idx}`} className="flex-1" />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

// Helper puro — chunk de array en grupos de tamaño N. Mantenido inline
// porque sólo se usa aquí; si en algún momento aparece en otro sitio,
// lo movemos a lib/.
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
