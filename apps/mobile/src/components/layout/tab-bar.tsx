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
 * TabBar — píldora flotante con morph al entrar en modo entreno.
 *
 * Animaciones via CSS (NativeWind `transition-*`):
 *  - Contenedor crece 64 → 116px (transition-[height])
 *  - Strip dentro: altura 0 → 52 + opacidad 0 → 1 (transition-all)
 *
 * Por qué CSS y no Reanimated: en web (react-native-web), CSS transitions
 * son GPU-accelerated y más predecibles. En nativo (futuro) las clases
 * `transition-*` se ignoran — habrá que añadir Reanimated cuando toque.
 * Ver memoria sobre stack siblings: el sheet vive en portal (BottomSheetModal)
 * y no rompe el layout vecino.
 *
 * El tab activo crece con muelle (Reanimated) — esa anim sí es interna y
 * funciona bien en ambos entornos.
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
          // h-[44px] dentro de un row h-[52px] deja 4px de respiro arriba/abajo:
          // la pastilla activa NO toca la curva interna del contenedor exterior,
          // evitando el "cortado/subido" visual cuando el tab activo está en
          // primera o última posición (las que sufren la curva del pill).
          'h-[44px] flex-row items-center justify-center gap-2 rounded-full active:opacity-80',
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
  const { activeWorkout, currentExercise, elapsedSeconds, openSheet } = useWorkoutSession();
  const hasWorkout = activeWorkout !== null;

  return (
    <View
      className={[
        // rounded-[34px] = pill perfecta en h=64 (34 = h/2) y rounded rectangle
        // elegante en h=116. rounded-full daba "bocadillo" en altura grande.
        'absolute bottom-6 left-[18px] right-[18px] flex-col justify-end gap-1 overflow-hidden rounded-[34px] border border-border-strong bg-surface/80 p-1.5 backdrop-blur-xl transition-[height] duration-300 ease-out',
        hasWorkout ? 'h-[116px]' : 'h-16',
      ].join(' ')}
      style={{ boxShadow: '0 12px 24px rgba(0, 0, 0, 0.4)', elevation: 12 }}
    >
      {/* Strip: render condicional sin wrapper raro — garantiza que el click
          siempre llegue al Pressable interno. La animación de aparición la
          hace el contenedor padre (transition-[height] del pill). */}
      {hasWorkout ? (
        <ActiveWorkoutStrip
          elapsedLabel={formatElapsed(elapsedSeconds)}
          exerciseName={currentExercise?.name ?? null}
          setLabel={
            currentExercise && currentExercise.currentSet !== null
              ? `Serie ${currentExercise.currentSet} de ${currentExercise.targetSets}`
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
