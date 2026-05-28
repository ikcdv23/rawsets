import { Text, View } from 'react-native';

/**
 * Divider — línea horizontal con texto opcional en el centro.
 *
 * Estilo "o continúa con" del mockup: dos rayas finas + texto eyebrow.
 * Si no se pasa label, es solo una línea fina.
 */
type DividerProps = {
  label?: string;
};

export function Divider({ label }: DividerProps) {
  if (!label) {
    return <View className="h-px w-full bg-border" />;
  }

  return (
    <View className="flex-row items-center gap-3.5">
      <View className="h-px flex-1 bg-border" />
      <Text className="font-sans-bold text-[10px] uppercase tracking-[1.6px] text-muted-dim">
        {label}
      </Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}
