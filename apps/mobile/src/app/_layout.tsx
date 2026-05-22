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
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }} />
    </>
  );
}
