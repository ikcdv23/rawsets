import { Pressable, Text, View } from 'react-native';

interface FreeDayBlockProps {
  onPlan: () => void;
}

export function FreeDayBlock({ onPlan }: FreeDayBlockProps) {
  return (
    <View className="py-1">
      <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">Hoy</Text>
      <Text className="mt-2 font-sans-bold text-lg text-foreground">Sin nada programado</Text>
      <Pressable
        accessibilityRole="link"
        onPress={onPlan}
        className="mt-2 self-start active:opacity-70"
        hitSlop={8}
      >
        <Text className="font-sans-bold text-sm text-primary">+ Programar este día</Text>
      </Pressable>
    </View>
  );
}
