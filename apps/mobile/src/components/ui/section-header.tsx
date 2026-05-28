import { Text, View } from 'react-native';

/**
 * SectionHeader — el "eyebrow" editorial: etiqueta en mayúsculas + línea
 * que rellena el resto del ancho. Separa secciones dentro de una pantalla.
 */
export function SectionHeader({ children }: { children: string }) {
  return (
    <View className="my-3 flex-row items-center gap-2.5">
      <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
        {children}
      </Text>
      {/* La línea: alto 1px, flex-1 para ocupar el hueco restante. */}
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}
