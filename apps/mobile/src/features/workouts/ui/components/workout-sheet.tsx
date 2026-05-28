import { useWorkoutSession } from '@/features/workouts/ui/contexts/workout-session-context';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

/**
 * WorkoutSheet — panel deslizable que cubre el ~92% de la pantalla con la
 * pantalla del entreno activo.
 *
 * **Renderizado vía `<Modal>`**: el contenido vive en un portal nativo fuera
 * del árbol React. Eso es lo que evita conflictos de layout con el `<Stack>`
 * vecino (intentos previos sin Modal rompían el flex de Tabs).
 *
 * Comportamiento:
 *  - `isSheetOpen` (del context) controla la apertura.
 *  - El Modal se mantiene montado durante la animación de cierre (estado
 *    interno `mounted`). Cuando termina el spring de cerrar, se desmonta.
 *  - Drag-to-close: handle de arriba arrastrable; >25% o flick rápido cierra.
 *  - Tap en backdrop también cierra.
 */

const CLOSE_FRACTION = 0.25;
const VELOCITY_CLOSE = 800;
const OPEN_SPRING = { damping: 22, stiffness: 220, mass: 1 };

export function WorkoutSheet() {
  const { isSheetOpen, closeSheet, activeWorkout } = useWorkoutSession();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = windowHeight * 0.92;
  const closeThreshold = sheetHeight * CLOSE_FRACTION;

  // Mantener el Modal montado durante la animación de cierre.
  // Lo encendemos cuando isSheetOpen pasa a true, y lo apagamos solo cuando
  // la animación de cierre termina (callback de withSpring).
  const [mounted, setMounted] = useState(false);

  const translateY = useSharedValue(sheetHeight);
  const dragStartY = useSharedValue(0);

  // Side effect 1: encender el modal cuando se quiere abrir.
  useEffect(() => {
    if (isSheetOpen) setMounted(true);
  }, [isSheetOpen]);

  // Side effect 2: una vez montado, animar a la posición correcta.
  useEffect(() => {
    if (!mounted) return;
    if (isSheetOpen) {
      // Abrir: subir a 0 (totalmente visible).
      translateY.value = withSpring(0, OPEN_SPRING);
    } else {
      // Cerrar: bajar a sheetHeight; al terminar, desmontar el Modal.
      translateY.value = withSpring(sheetHeight, OPEN_SPRING, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [isSheetOpen, mounted, sheetHeight, translateY]);

  const pan = Gesture.Pan()
    .onStart(() => {
      dragStartY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateY.value = Math.max(0, dragStartY.value + event.translationY);
    })
    .onEnd((event) => {
      const shouldClose = translateY.value > closeThreshold || event.velocityY > VELOCITY_CLOSE;
      if (shouldClose) {
        translateY.value = withSpring(sheetHeight, OPEN_SPRING, (finished) => {
          if (finished) runOnJS(setMounted)(false);
        });
        runOnJS(closeSheet)();
      } else {
        translateY.value = withSpring(0, OPEN_SPRING);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: 1 - translateY.value / sheetHeight,
  }));

  // Si no está montado, no renderizamos NADA — ni siquiera el Modal vacío.
  // Eso garantiza cero impacto en la app cuando no hay entreno activo abierto.
  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={closeSheet}>
      {/* Wrapper que cubre toda la pantalla del Modal. Posicionamos backdrop
          y sheet con absolute relativo a este wrapper. */}
      <View className="flex-1">
        <Animated.View
          pointerEvents="auto"
          style={backdropStyle}
          className="absolute inset-0 bg-black/55"
        >
          <Pressable
            accessibilityLabel="Cerrar sheet"
            onPress={closeSheet}
            className="h-full w-full"
          />
        </Animated.View>

        <Animated.View
          style={[{ height: sheetHeight, boxShadow: '0 -20px 60px rgba(0,0,0,0.7)' }, sheetStyle]}
          className="absolute bottom-0 left-0 right-0 rounded-t-[32px] border-t border-border-strong bg-background"
        >
          <GestureDetector gesture={pan}>
            <View className="items-center px-6 pt-2 pb-2">
              <View className="h-1 w-10 rounded-full bg-border-strong" />
            </View>
          </GestureDetector>

          <View className="flex-1 px-6 pb-6">
            <Text className="font-sans-bold text-[10px] uppercase tracking-[1.6px] text-muted">
              {activeWorkout?.routineName ?? 'Entreno libre'}
            </Text>
            <Text className="mt-2 font-sans-black text-[28px] tracking-[-0.9px] text-foreground">
              Pantalla del entreno
            </Text>
            <Text className="mt-2 font-sans-medium text-[13px] leading-[19px] text-muted">
              Aquí irán los ejercicios, series, timer y demás. Por ahora, placeholder mientras
              montamos el resto. Arrastra el handle hacia abajo para cerrar.
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
