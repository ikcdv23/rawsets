import { Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="font-display text-6xl text-foreground">RAWSETS</Text>
      <View className="mt-2 h-2 w-2 bg-primary" />
      <Text className="mt-8 font-mono text-xs uppercase tracking-widest text-muted">
        {'// workout tracker · v0.0.1'}
      </Text>
    </View>
  );
}
