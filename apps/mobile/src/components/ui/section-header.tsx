import { Text, View } from 'react-native';

/**
 * SectionHeader — el "eyebrow" editorial: etiqueta en mayúsculas + línea
 * que rellena el resto del ancho. Separa secciones dentro de una pantalla.
 *
 * Opcional: `accessory` aparece a la derecha del título (antes de la línea),
 * en color primary. Útil para contadores tipo "LOGROS  4 / 12".
 */
export function SectionHeader({
  children,
  accessory,
}: {
  children: string;
  accessory?: string;
}) {
  return (
    <View className="my-3 flex-row items-center gap-2.5">
      <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
        {children}
      </Text>
      {accessory ? (
        <Text className="font-mono-bold text-[10px] tracking-[0.4px] text-primary">
          {accessory}
        </Text>
      ) : null}
      {/* La línea: alto 1px, flex-1 para ocupar el hueco restante. */}
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}
