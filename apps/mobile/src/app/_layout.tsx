import '@/global.css';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  Inter_900Black,
  useFonts,
} from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { ZenDots_400Regular } from '@expo-google-fonts/zen-dots';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    Inter_900Black,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
    ZenDots_400Regular,
  });

  if (!loaded) return null;

  return (
    // Marco mobile-first: en web el contenido se limita a ~440px y se centra
    // (el fondo oscuro rellena los lados). En móvil real, max-w no aplica → ancho completo.
    <View className="flex-1 items-center bg-background">
      <StatusBar style="light" />
      <View className="w-full max-w-[440px] flex-1">
        <Stack
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0A0A' } }}
        />
      </View>
    </View>
  );
}
