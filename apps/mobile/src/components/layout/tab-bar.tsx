import { ActiveWorkoutStrip } from '@/features/workouts/ui/components/active-workout-strip';
import {
  formatElapsed,
  useWorkoutSession,
} from '@/features/workouts/ui/contexts/workout-session-context';
import { BookMarked, Home, type LucideIcon, PersonStanding, Settings } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

/**
 * TabBar — píldora flotante de navegación.
 *
 * Dos estados según `useWorkoutSession()`:
 *  - SIN entreno activo → altura 64, solo los 4 tabs.
 *  - CON entreno activo → altura 116, arriba aparece el ActiveWorkoutStrip.
 *
 * NOTA importante: la altura del CONTENEDOR es estática (className condicional),
 * NO animada. Animar la altura con Animated.View + position:absolute en web
 * rompía el layout del Stack vecino (el flex de Tabs colapsaba). El morph es
 * "instantáneo" — los tabs internos sí siguen animando su flexGrow.
 *
 * El tap en el strip → openSheet(): lo abre el WorkoutSheet (Modal).
 */
type TabBarRoute = { key: string; name: string };
type TabBarProps = {
  state: { index: number; routes: TabBarRoute[] };
  navigation: { navigate: (name: string) => void };
};

const TABS: Record<string, { Icon: LucideIcon; label: string }> = {
  'home/index': { Icon: Home, label: 'Home' },
  'routines/index': { Icon: BookMarked, label: 'Rutinas' },
  'body/index': { Icon: PersonStanding, label: 'Body' },
  'settings/index': { Icon: Settings, label: 'Ajustes' },
};

const ICON_ACTIVE = '#0A0A0A';
const ICON_INACTIVE = '#8A8A8A';

const GROW_SPRING = { damping: 14, stiffness: 170, mass: 0.9 };

function Tab({
  tab,
  isActive,
  onPress,
}: {
  tab: { Icon: LucideIcon; label: string };
  isActive: boolean;
  onPress: () => void;
}) {
  const grow = useSharedValue(isActive ? 2 : 1);

  useEffect(() => {
    grow.value = withSpring(isActive ? 2 : 1, GROW_SPRING);
  }, [isActive, grow]);

  const animatedStyle = useAnimatedStyle(() => ({ flexGrow: grow.value }));

  const Icon = tab.Icon;

  return (
    <Animated.View style={[{ flexBasis: 0 }, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={isActive ? { selected: true } : {}}
        accessibilityLabel={tab.label}
        onPress={onPress}
        className={[
          'h-[52px] flex-row items-center justify-center gap-2 rounded-full active:opacity-80',
          isActive ? 'bg-primary' : '',
        ].join(' ')}
      >
        <Icon
          color={isActive ? ICON_ACTIVE : ICON_INACTIVE}
          size={20}
          strokeWidth={isActive ? 2.6 : 2.2}
        />
        {isActive ? (
          <Text className="font-sans-bold text-[11px] uppercase tracking-[1px] text-background">
            {tab.label}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export function TabBar({ state, navigation }: TabBarProps) {
  const { activeWorkout, elapsedSeconds, openSheet } = useWorkoutSession();
  const hasWorkout = activeWorkout !== null;

  return (
    <View
      className={[
        // Glassmorphism: 80% surface + backdrop-blur. En web `backdrop-blur-xl`
        // genera el efecto "cristal esmerilado" del mockup. En nativo, NativeWind
        // no aplica backdrop-filter — convendrá usar `expo-blur` si llegamos.
        'absolute bottom-6 left-[18px] right-[18px] flex-col justify-end gap-1 rounded-[28px] border border-border-strong bg-surface/80 p-1.5 backdrop-blur-xl',
        hasWorkout ? 'h-[116px]' : 'h-16',
      ].join(' ')}
      style={{ boxShadow: '0 12px 24px rgba(0, 0, 0, 0.4)', elevation: 12 }}
    >
      {hasWorkout ? (
        <ActiveWorkoutStrip
          elapsedLabel={formatElapsed(elapsedSeconds)}
          exerciseName={activeWorkout.currentExercise?.name ?? null}
          setLabel={
            activeWorkout.currentExercise
              ? `Serie ${activeWorkout.currentExercise.setNumber} de ${activeWorkout.currentExercise.totalSets}`
              : null
          }
          onPress={openSheet}
        />
      ) : null}

      <View className="h-[52px] flex-row items-center gap-1">
        {state.routes.map((route, idx) => {
          const tab = TABS[route.name];
          if (!tab) return null;

          const isActive = state.index === idx;
          return (
            <Tab
              key={route.key}
              tab={tab}
              isActive={isActive}
              onPress={() => {
                if (!isActive) navigation.navigate(route.name);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
