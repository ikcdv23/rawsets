import { ChevronUp } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * ActiveWorkoutStrip — la franja superior de la tab bar cuando hay un entreno
 * activo. Tap → abre el WorkoutSheet.
 *
 * Componentes visuales: punto lima pulsante + tiempo (MM:SS lima) + ejercicio
 * actual + chevron de expandir. Sigue el mockup auth/home-to-workout.
 */
type ActiveWorkoutStripProps = {
  /** Tiempo transcurrido ya formateado (ej. "12:34"). El padre lo calcula. */
  elapsedLabel: string;
  /** Nombre del ejercicio actual (ej. "Press banca"). Opcional — sin ejercicio asignado, no se pinta esa columna. */
  exerciseName: string | null;
  /** "Serie 3 de 5" — el padre puede pasarlo formateado o pasar los dos números (ver abajo). */
  setLabel: string | null;
  onPress: () => void;
};

export function ActiveWorkoutStrip({
  elapsedLabel,
  exerciseName,
  setLabel,
  onPress,
}: ActiveWorkoutStripProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Abrir entreno activo"
      onPress={onPress}
      className="h-[52px] flex-row items-center gap-3 px-3.5 active:opacity-80"
    >
      <PulseDot />

      <Text className="font-sans-black text-[15px] tracking-[-0.3px] text-primary">
        {elapsedLabel}
      </Text>

      <View className="h-[18px] w-px bg-border-strong" />

      <View className="flex-1">
        {exerciseName ? (
          <Text className="font-sans-bold text-[12.5px] text-foreground" numberOfLines={1}>
            {exerciseName}
          </Text>
        ) : (
          <Text className="font-sans-bold text-[12.5px] text-muted" numberOfLines={1}>
            Entreno en curso
          </Text>
        )}
        {setLabel ? (
          <Text className="mt-[2px] font-sans-bold text-[9px] uppercase tracking-[1.4px] text-muted">
            {setLabel}
          </Text>
        ) : null}
      </View>

      <ChevronUp color="#8A8A8A" size={20} strokeWidth={2.2} />
    </Pressable>
  );
}

/**
 * PulseDot — punto lima 8px con un anillo que se expande y se desvanece
 * en loop. Reanimated: scale 1 → 2.6, opacity 0.5 → 0, ciclo de 1.8s.
 *
 * Por qué reanimated y no `Animated` legacy: porque withRepeat + scale
 * animado por JS en el thread principal va lento. Reanimated lo corre en
 * el UI thread → fluido en móvil, y en web cae a CSS animations bajo el
 * capó.
 */
function PulseDot() {
  const phase = useSharedValue(0);

  useEffect(() => {
    // 0 → 1 en 1.8s, lineal, repetido infinitamente.
    phase.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.linear }), -1, false);
  }, [phase]);

  // Cada frame: scale = 1 + phase*1.6 (1 → 2.6), opacity = 0.5 * (1 - phase).
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + phase.value * 1.6 }],
    opacity: 0.5 * (1 - phase.value),
  }));

  return (
    <View className="relative h-2 w-2">
      {/* Punto sólido en el centro. */}
      <View className="absolute inset-0 rounded-full bg-primary" />
      {/* Anillo pulsante (encima del punto, pero crece y se desvanece). */}
      <Animated.View
        className="absolute inset-0 rounded-full bg-primary"
        style={ringStyle}
        pointerEvents="none"
      />
    </View>
  );
}
