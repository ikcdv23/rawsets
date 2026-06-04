import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

// Splash REACT que toma el relevo del splash nativo.
//
// Composición del logo de marca (replica del monograma tentativo del brand book):
//   ┌──────────────┐
//   │              │
//   │      R       │   ← lima sobre fondo dark
//   │              │
//   └──────────────┘
//        RAWSETS.   ← wordmark debajo
//          •        ← dot pulsante (señal "viva")
//
// Tres animaciones independientes:
//   1. Entrada del monograma: fade 0→1 + scale 0.7→1 con spring suave.
//   2. Breathing constante del monograma: scale 1↔1.04 muy sutil.
//   3. Pulso del dot lima debajo (loop fade 0.25↔1).
//
// Console logs de mount/unmount intencionales — sirven para verificar si el
// splash desaparece cuando toca. Si ves "mount" pero no "unmount", hay un
// gate que no se cumple (DB no lista, timer no disparado, etc.).
export function SplashScreen() {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.7)).current;
  const breathe = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    console.log('[splash] mount @', Date.now());

    // Entrada — opacidad + escala con spring suave.
    const enter = Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleIn, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]);

    // Breathing continuo del monograma — muy sutil para que no distraiga.
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.04, duration: 1400, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ]),
    );

    // Pulso del dot.
    const pulsing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.25, duration: 800, useNativeDriver: true }),
      ]),
    );

    enter.start(() => {
      // El breathing arranca DESPUÉS de la entrada — encadenado limpio.
      breathing.start();
    });
    pulsing.start();

    return () => {
      console.log('[splash] unmount @', Date.now());
      enter.stop();
      breathing.stop();
      pulsing.stop();
    };
  }, [fadeIn, scaleIn, breathe, pulse]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      {/* Monograma: lima square + "R" black. La R usa font-display (Zen Dots).
          Si la fuente aún no cargó, cae a sans del sistema — visualmente
          aceptable mientras llega. */}
      <Animated.View
        style={{
          opacity: fadeIn,
          transform: [{ scale: Animated.multiply(scaleIn, breathe) }],
        }}
      >
        <View
          className="h-[124px] w-[124px] items-center justify-center rounded-[28px]"
          style={{ backgroundColor: '#A8E055' }}
        >
          <Text
            className="font-display"
            style={{
              fontSize: 68,
              lineHeight: 80,
              color: '#0A0A0A',
              letterSpacing: -2,
            }}
          >
            R
          </Text>
        </View>
      </Animated.View>

      {/* Wordmark — aparece bajo el monograma con el mismo fade-in. */}
      <Animated.Text
        className="mt-7 font-sans-black tracking-[-0.5px] text-foreground"
        style={{ fontSize: 18, opacity: fadeIn }}
      >
        RAWSETS<Text className="text-primary">.</Text>
      </Animated.Text>

      {/* Dot pulsante — señal "estoy vivo, calentando" sin texto. */}
      <Animated.View className="mt-10 h-2 w-2 rounded-full bg-primary" style={{ opacity: pulse }} />
    </View>
  );
}
