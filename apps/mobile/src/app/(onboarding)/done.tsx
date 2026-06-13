import { Button } from '@/components/ui/button';
import { useRepos } from '@/db/repo-provider';
import { completeOnboarding } from '@/features/user/use-cases/complete-onboarding';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';

// Step 5 — Done. Sella `onboardedAt` y manda al workspace.
//
// UX: animación de check exitoso, mensaje cálido, botón "Empezar a entrenar".
// On press: replace (no push) para que el back gesture NO vuelva al onboarding.
export default function OnboardingDoneScreen() {
  const { user: repo } = useRepos();

  const [submitting, setSubmitting] = useState(false);

  const checkScale = useRef(new Animated.Value(0)).current;
  const checkRotate = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // El anillo aparece primero (spring grande)
      Animated.spring(ringScale, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
      // El check entra con scale + slight rotation
      Animated.parallel([
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 5,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(checkRotate, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Textos en cascada
      Animated.timing(titleOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(ctaOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  }, [ringScale, checkScale, checkRotate, titleOpacity, subtitleOpacity, ctaOpacity]);

  const handleStart = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await completeOnboarding(repo);
      if (!result.ok) throw result.error;

      // replace para que no se pueda volver al onboarding con back.
      router.replace('/home');
    } catch (err) {
      console.error('[onboarding/done] complete error:', err);
      setSubmitting(false);
    }
  };

  const rotation = checkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-25deg', '0deg'],
  });

  return (
    <View className="flex-1 items-center justify-between bg-background px-6 pb-10 pt-24">
      <View className="flex-1 items-center justify-center">
        {/* Anillo de fondo + check icon */}
        <Animated.View
          className="h-[120px] w-[120px] items-center justify-center rounded-full bg-primary"
          style={{ transform: [{ scale: ringScale }] }}
        >
          <Animated.View style={{ transform: [{ scale: checkScale }, { rotate: rotation }] }}>
            <Check color="#0A0A0A" size={64} strokeWidth={3} />
          </Animated.View>
        </Animated.View>

        <Animated.Text
          className="mt-10 text-center font-sans-black text-[28px] leading-[32px] tracking-[-0.8px] text-foreground"
          style={{ opacity: titleOpacity }}
        >
          Todo listo.
        </Animated.Text>

        <Animated.Text
          className="mt-3 text-center font-sans text-[15px] leading-[22px] text-muted"
          style={{ opacity: subtitleOpacity, maxWidth: 280 }}
        >
          Tu primera rutina te espera al otro lado. A entrenar.
        </Animated.Text>
      </View>

      <Animated.View className="w-full" style={{ opacity: ctaOpacity }}>
        <Button onPress={handleStart} disabled={submitting}>
          {submitting ? 'Entrando…' : 'Empezar a entrenar'}
        </Button>
      </Animated.View>
    </View>
  );
}
