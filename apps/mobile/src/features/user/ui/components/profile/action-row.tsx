import { Pressable, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

interface ActionRowProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  description: string;
  onPress: () => void;
  destructive?: boolean;
}

export function ActionRow({
  icon: Icon,
  iconColor,
  label,
  description,
  onPress,
  destructive = false,
}: ActionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-4 rounded-2xl border border-border-strong bg-surface px-4 py-4 active:opacity-80"
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{
          backgroundColor: destructive ? 'rgba(255, 59, 92, 0.12)' : 'rgba(168, 224, 85, 0.12)',
        }}
      >
        <Icon color={iconColor} size={18} strokeWidth={2.4} />
      </View>
      <View className="flex-1">
        <Text
          className={[
            'font-sans-bold text-[14px]',
            destructive ? 'text-destructive' : 'text-foreground',
          ].join(' ')}
        >
          {label}
        </Text>
        <Text className="mt-0.5 font-sans text-[11px] leading-[16px] text-muted">
          {description}
        </Text>
      </View>
    </Pressable>
  );
}
