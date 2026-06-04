import { AvatarIcon } from '@/components/ui/profile/avatar-icon';
import { Text, View } from 'react-native';

type HeadTopProps = {
  title?: string;
};

export function HeadTop({ title }: HeadTopProps) {
  return (
    <View className="mb-2 flex-row items-center justify-between">
      <Text className="font-sans-black text-3xl tracking-[-0.5px] text-foreground">
        {title}
        <Text className="text-primary">.</Text>
      </Text>
      <AvatarIcon />
    </View>
  );
}
