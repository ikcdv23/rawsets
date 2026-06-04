import { Text, View } from 'react-native';

// Mini-card de estadística para el detalle de rutina. Tres se ponen en fila:
// SERIES (totales), FRECUENCIA (x4/sem), ÚLTIMO (fecha del último entreno).
//
// `superscript` permite el patrón "x4 /sem" con el "/sem" pequeño en superíndice.
// Si no se pasa, solo se muestra `value`.
export type RoutineStatTileProps = {
  label: string;
  value: string;
  superscript?: string;
};

export function RoutineStatTile({ label, value, superscript }: RoutineStatTileProps) {
  return (
    <View
      className="flex-1 overflow-hidden rounded-[18px] border border-border p-3.5"
      style={{ backgroundColor: '#141414' }}
    >
      <View className="flex-row items-baseline">
        <Text
          className="font-sans-black text-[24px] tracking-[-0.5px] text-foreground"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {value}
        </Text>
        {superscript ? (
          <Text className="ml-0.5 font-sans-bold text-[10px] text-muted">{superscript}</Text>
        ) : null}
      </View>
      <Text className="mt-1 font-sans-bold text-[9px] uppercase tracking-[1.5px] text-muted">
        {label}
      </Text>
    </View>
  );
}
