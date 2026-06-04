import '@/global.css';

import { SplashScreen } from '@/components/ui/splash-screen';
import { DbProvider } from '@/db/db-provider';
import { WorkoutSheet } from '@/features/workouts/ui/components/workout-sheet';
import { WorkoutSessionProvider } from '@/features/workouts/ui/contexts/workout-session-context';
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
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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

  // Mientras las fuentes carguen mostramos splash (cae al fallback del sistema).
  if (!loaded) {
    return <SplashScreen />;
  }

  // Sin piso de tiempo — el gate abre EN CUANTO la DB esté lista.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DbProvider>
        <WorkoutSessionProvider>
          <View className="flex-1 items-center bg-background">
            <StatusBar style="light" />
            <View className="w-full max-w-[440px] flex-1">
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#0A0A0A' },
                }}
              />
            </View>
            <WorkoutSheet />
          </View>
        </WorkoutSessionProvider>
      </DbProvider>
    </GestureHandlerRootView>
  );
}
