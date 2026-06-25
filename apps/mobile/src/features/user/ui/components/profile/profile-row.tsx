import { Text, View } from 'react-native';

interface ProfileRowProps {
  label: string;
  value: string;
}

export function ProfileRow({ label, value }: ProfileRowProps) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <Text className="font-sans-medium text-[12px] text-muted">{label}</Text>
      <Text className="font-sans-bold text-[14px] text-foreground">{value}</Text>
    </View>
  );
}

export function Divider() {
  return <View className="h-px bg-border" />;
}
