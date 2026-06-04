import { Button } from '@/components/ui/button';
import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

// Step 0 — Welcome. Sin progress bar, sin back. Solo marca + tagline + CTA.
//
// Es la primera impresión real de la app. Vale la pena el polish:
//   - Monograma lima con spring entry
//   - Wordmark fade-in retrasado
//   - Tagline con typewriter-like fade word-by-word (sutil)
//   - Botón en la parte baja con icono arrow
export default function WelcomeScreen() {
  const monogramScale = useRef(new Animated.Value(0.5)).current;
  const monogramOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Cascada: monograma → wordmark → tagline → cta.
    Animated.sequence([
      Animated.parallel([
        Animated.spring(monogramScale, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(monogramOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(wordmarkOpacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(ctaOpacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start();

    // Breathing continuo del monograma (mismo patrón que el splash).
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.03, duration: 1600, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1, duration: 1600, useNativeDriver: true }),
      ]),
    );
    breathing.start();
    return () => breathing.stop();
  }, [monogramScale, monogramOpacity, wordmarkOpacity, taglineOpacity, ctaOpacity, breathe]);

  return (
    <View className="flex-1 items-center justify-between bg-background px-6 pb-10 pt-24">
      {/* Bloque marca centrado verticalmente */}
      <View className="flex-1 items-center justify-center">
        <Animated.View
          style={{
            opacity: monogramOpacity,
            transform: [{ scale: Animated.multiply(monogramScale, breathe) }],
          }}
        >
          <View
            className="h-[110px] w-[110px] items-center justify-center rounded-[26px]"
            style={{ backgroundColor: '#A8E055' }}
          >
            <Text
              className="font-display"
              style={{ fontSize: 60, lineHeight: 72, color: '#0A0A0A', letterSpacing: -2 }}
            >
              R
            </Text>
          </View>
        </Animated.View>

        <Animated.Text
          className="mt-8 font-sans-black tracking-[-0.5px] text-foreground"
          style={{ fontSize: 22, opacity: wordmarkOpacity }}
        >
          RAWSETS<Text className="text-primary">.</Text>
        </Animated.Text>

        <Animated.Text
          className="mt-3 text-center font-sans text-[14px] text-muted"
          style={{ opacity: taglineOpacity }}
        >
          Entrena con balance.
        </Animated.Text>
      </View>

      {/* CTA al fondo */}
      <Animated.View className="w-full" style={{ opacity: ctaOpacity }}>
        <Button icon={ArrowRight} onPress={() => router.push('/name')}>
          Empezar
        </Button>
        <Text className="mt-4 text-center font-sans text-[11px] text-muted-dim">
          Datos guardados en tu dispositivo. Sin cuenta.
        </Text>
      </Animated.View>
    </View>
  );
}
