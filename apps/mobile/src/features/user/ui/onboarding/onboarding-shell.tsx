import { safeBack } from '@/lib/safe-back';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { OnboardingProgress } from './onboarding-progress';

// Shell común de cada step del onboarding.
//
// Composición:
//   ┌─────────────────────────────┐
//   │ ←  progress----             │  header: back + barra
//   │                             │
//   │  Title gigante              │  hero
//   │  Subtítulo opcional         │
//   │                             │
//   │  {children}                 │  contenido del step
//   │                             │
//   │  [primary action]           │  footer: CTA pegado abajo
//   └─────────────────────────────┘
//
// Anima en mount: fade-in + slide-up suave del bloque entero. Cada step se
// monta fresco gracias al Stack de expo-router, así que la animación se
// dispara automáticamente al navegar.
//
// KeyboardAvoidingView para que el input no quede tapado por el teclado en
// los steps con teclado (name, body).
type OnboardingShellProps = {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
  // Si el step no debe permitir volver atrás (welcome, done), oculto el botón.
  hideBack?: boolean;
};

export function OnboardingShell({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  footer,
  hideBack = false,
}: OnboardingShellProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, friction: 8, tension: 65, useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View className="flex-1 bg-background px-6 pb-6 pt-12">
        {/* Header — back + progress bar. Mantengo altura fija para que la
            barra esté siempre a la misma altura aunque haya o no botón back. */}
        <View className="mb-12 h-9 flex-row items-center gap-4">
          {hideBack || !router.canGoBack() ? (
            // Reservamos el hueco fijo (9×9) para que el progress bar no
            // baile cuando hide cambia entre pantallas. Mejor pixel-stable.
            <View className="h-9 w-9" />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={() => safeBack('/welcome')}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-surface active:opacity-70"
            >
              <ChevronLeft color="#FAFAFA" size={20} strokeWidth={2.4} />
            </Pressable>
          )}
          <View className="flex-1">
            <OnboardingProgress step={step} total={totalSteps} />
          </View>
        </View>

        {/* Hero — título grande + subtítulo. Anima al montar. */}
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
          <Text className="font-sans-black text-[32px] leading-[36px] tracking-[-1px] text-foreground">
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-3 font-sans text-[15px] leading-[22px] text-muted">{subtitle}</Text>
          ) : null}
        </Animated.View>

        {/* Contenido del step — también con fade-in pero retrasado para que
            llegue después del hero (lectura escalonada). */}
        <Animated.View
          style={{ opacity: fade, transform: [{ translateY: slide }], flex: 1 }}
          className="mt-10"
        >
          {children}
        </Animated.View>

        {/* Footer fijo abajo — el CTA respira con safe-area. */}
        <View className="mt-6">{footer}</View>
      </View>
    </KeyboardAvoidingView>
  );
}
