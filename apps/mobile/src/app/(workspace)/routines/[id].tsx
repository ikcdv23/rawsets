import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="font-sans-black text-3xl text-foreground">Routine</Text>
      <Text className="mt-4 font-mono text-sm text-muted">{id}</Text>
    </View>
  );
}
