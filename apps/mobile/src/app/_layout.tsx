import '@/global.css';

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

  if (!loaded) return null;

  // GestureHandlerRootView envuelve TODO: cualquier gesto (drag del sheet,
  // swipe, pan) necesita estar dentro de este root o no funciona.
  //
  // DbProvider abre SQLite (async-safe en web), aplica migrations y corre
  // el seed. Bloquea el render del resto del árbol hasta que la DB está lista.
  //
  // WorkoutSessionProvider envuelve auth + workspace para que el WorkoutSheet
  // viva como sibling del Stack y se posicione absolute por encima de todo.
  //
  // Marco mobile-first: en web el contenido se limita a ~440px y se centra
  // (el fondo oscuro rellena los lados). En móvil real, max-w no aplica → ancho completo.
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
            {/* WorkoutSheet usa plain RN Modal (portal nativo) → no afecta
                al layout del Stack vecino. */}
            <WorkoutSheet />
          </View>
        </WorkoutSessionProvider>
      </DbProvider>
    </GestureHandlerRootView>
  );
}
