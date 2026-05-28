import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

/**
 * AvatarIcon — círculo con iniciales que navega al perfil.
 * Sin foto aún (Fase 2): cuando la haya, cambiar el <Text> por
 * <Image source={{ uri }} className="h-10 w-10 rounded-full" />.
 */
type AvatarIconProps = {
  initials?: string; // por defecto "JA"
};

export function AvatarIcon({ initials = 'JA' }: AvatarIconProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Abrir perfil"
      onPress={() => router.push('/profile')}
      className="h-10 w-10 items-center justify-center rounded-full border border-border-strong bg-surface-2 active:opacity-80"
    >
      <Text className="font-sans-bold text-sm text-primary">{initials}</Text>
    </Pressable>
  );
}
