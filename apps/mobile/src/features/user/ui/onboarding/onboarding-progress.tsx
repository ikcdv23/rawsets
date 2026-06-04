import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

// Barra de progreso del onboarding.
//
// Diseño: línea fina llena que crece de izquierda a derecha. Sin números, sin
// dots. Subliminal. La proporción debe ser un float de 0..1 — el componente
// no sabe del total de steps, solo del fill.
//
// Animación: el ancho se interpola con spring para que cada paso "respire"
// en vez de saltar. useNativeDriver=false porque animamos width (layout prop).
export function OnboardingProgress({ step, total }: { step: number; total: number }) {
  // Clamp 0..1 — defensivo contra steps fuera de rango.
  const target = Math.max(0, Math.min(step / total, 1));
  const widthAnim = useRef(new Animated.Value(target)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: target,
      friction: 9,
      tension: 60,
      useNativeDriver: false,
    }).start();
  }, [target, widthAnim]);

  // Interpolamos la animación a string '%' porque width acepta % nativo.
  const widthInterp = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View className="h-[3px] w-full overflow-hidden rounded-full bg-border">
      <Animated.View className="h-full rounded-full bg-primary" style={{ width: widthInterp }} />
    </View>
  );
}
