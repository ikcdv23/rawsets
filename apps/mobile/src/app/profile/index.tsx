import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

// Perfil — vive en la RAÍZ (fuera de (workspace)), así se apila encima de las
// tabs a pantalla completa, sin tab bar. Tiene su propio botón "atrás".
export default function ProfileScreen() {
  return (
    <View className="flex-1 bg-background px-6 pt-16">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={() => router.back()}
        className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface active:opacity-80"
      >
        <ChevronLeft color="#8A8A8A" size={20} />
      </Pressable>

      <Text className="mt-6 font-sans-black text-3xl text-foreground">Perfil</Text>
      <Text className="mt-2 font-sans text-sm text-muted">
        Insignias, medidas y nivel — pendiente de montar.
      </Text>
    </View>
  );
}
