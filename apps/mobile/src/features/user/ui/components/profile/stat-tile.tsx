import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

interface StatTileProps {
  value: string;
  label: string;
}

export function StatTile({ value, label }: StatTileProps) {
  return (
    <View className="flex-1 overflow-hidden rounded-2xl border border-border-strong">
      <LinearGradient
        colors={['#1A1A1A', '#141414']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 16, paddingVertical: 16 }}
      >
        <Text className="font-sans-black text-[26px] leading-[30px] tracking-[-1px] text-foreground">
          {value}
        </Text>
        <Text className="mt-1 font-sans-bold text-[10px] uppercase tracking-[1.4px] text-muted">
          {label}
        </Text>
      </LinearGradient>
    </View>
  );
}
