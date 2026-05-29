import {
  type WorkoutExercise,
  formatElapsed,
  useWorkoutSession,
} from '@/features/workouts/ui/contexts/workout-session-context';
import { Check, ChevronDown, ChevronRight, Circle } from 'lucide-react-native';
import { useEffect } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * WorkoutSheet — modal slide-up usando `<Modal animationType="slide">`.
 *
 * Animación nativa de React Native: el propio Modal hace la animación
 * slide-up cuando `visible` pasa a true, y slide-down cuando pasa a false.
 * Funciona en iOS, Android y web (react-native-web replica el comportamiento
 * con CSS). Es el patrón más simple y robusto.
 *
 * Por qué este enfoque vs Reanimated/librería:
 *  - Cero custom animation code.
 *  - Cero race conditions de mount/slide/unmount.
 *  - State source único: isSheetOpen del context controla `visible`.
 *  - Apple Music / Spotify usan el primitivo nativo equivalente en iOS.
 *
 * Cierres:
 *  - Tap en backdrop → closeSheet()
 *  - Tap en chevron-down del header → closeSheet()
 *  - Tap en "Finalizar" → finishWorkout() (cierra + termina entreno)
 *  - onRequestClose (back button Android) → closeSheet()
 *
 * Drag-to-close se difiere a futura iteración con gesture-handler.
 */

export function WorkoutSheet() {
  const { activeWorkout, progressLabel, elapsedSeconds, isSheetOpen, closeSheet, finishWorkout } =
    useWorkoutSession();

  return (
    <Modal visible={isSheetOpen} transparent animationType="slide" onRequestClose={closeSheet}>
      {/* Backdrop: tap fuera del sheet = cerrar. Como animationType="slide" mueve
          el contenedor entero, el backdrop también se desliza con él — eso es
          deliberado en el patrón "full-height bottom sheet". */}
      <Pressable
        accessibilityLabel="Cerrar sheet"
        onPress={closeSheet}
        className="flex-1 bg-black/55"
      >
        {/* Pressable interior absorbe taps para que tocar el contenido NO
            cierre el sheet (solo el backdrop visible alrededor). */}
        <Pressable
          onPress={() => {}}
          style={{ backgroundColor: '#0A0A0A' }}
          className="absolute bottom-0 left-0 right-0 h-[92%] rounded-t-[32px] border-t border-border-strong"
        >
          {/* Handle visual (sin gesture todavía). */}
          <View className="items-center pb-1 pt-2">
            <View className="h-1 w-10 rounded-full bg-border-strong" />
          </View>

          <SheetHeader
            progressLabel={progressLabel}
            timerLabel={formatElapsed(elapsedSeconds)}
            routineName={activeWorkout?.routineName ?? 'Entreno libre'}
            routineSubtitle={activeWorkout?.routineSubtitle ?? null}
            onClose={closeSheet}
          />

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 18, paddingBottom: 100, gap: 10 }}
            showsVerticalScrollIndicator={false}
          >
            {activeWorkout?.exercises.map((ex) => (
              <ExerciseRow key={ex.id} exercise={ex} />
            ))}
          </ScrollView>

          <SheetFooter onFinish={finishWorkout} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

type SheetHeaderProps = {
  progressLabel: string | null;
  timerLabel: string;
  routineName: string;
  routineSubtitle: string | null;
  onClose: () => void;
};

function SheetHeader({
  progressLabel,
  timerLabel,
  routineName,
  routineSubtitle,
  onClose,
}: SheetHeaderProps) {
  return (
    <View className="border-b border-border px-6 pb-5">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="font-sans-bold text-[10px] uppercase tracking-[1.8px] text-muted">
          Entreno activo
          {progressLabel ? (
            <Text className="font-sans-bold text-primary"> · {progressLabel}</Text>
          ) : null}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Minimizar"
          onPress={onClose}
          className="h-8 w-8 items-center justify-center rounded-full border border-border-strong bg-surface active:opacity-70"
          hitSlop={4}
        >
          <ChevronDown color="#8A8A8A" size={14} strokeWidth={2.6} />
        </Pressable>
      </View>

      <View className="flex-row items-baseline gap-3.5">
        <View className="self-center">
          <PulseDot />
        </View>
        <Text
          className="font-sans-black text-primary"
          style={{ fontSize: 52, lineHeight: 52, letterSpacing: -2.5 }}
        >
          {timerLabel}
        </Text>
        <Text className="ml-auto self-center font-sans-bold text-[10px] uppercase tracking-[1.8px] text-muted">
          Tiempo total
        </Text>
      </View>

      <View className="mt-3.5 flex-row items-baseline">
        <Text className="font-sans-bold text-[13px] tracking-[-0.05px] text-foreground">
          {routineName}
        </Text>
        {routineSubtitle ? (
          <Text className="ml-1.5 font-sans-medium text-[13px] text-muted">
            · {routineSubtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function ExerciseRow({ exercise }: { exercise: WorkoutExercise }) {
  const { name, muscleGroup, targetSets, targetReps, status, currentSet } = exercise;

  const metaText =
    status === 'current' && currentSet !== null
      ? `Serie ${currentSet} / ${targetSets}`
      : `${targetSets} series`;

  const summaryText =
    status === 'current' && currentSet !== null
      ? `${currentSet} / ${targetSets}`
      : `${targetSets} × ${targetReps}`;

  const nameTone =
    status === 'current' ? 'text-foreground' : status === 'done' ? 'text-muted' : 'text-muted';
  const nameWeight = status === 'current' ? 'font-sans-bold' : 'font-sans-medium';

  const summaryTone =
    status === 'done' ? 'text-primary' : status === 'current' ? 'text-foreground' : 'text-muted';

  return (
    <View
      style={{ backgroundColor: '#141414' }}
      className="flex-row items-center gap-3 rounded-[18px] border border-border px-4 py-3.5"
    >
      <StatusCircle status={status} />

      <View className="min-w-0 flex-1">
        <Text className={`text-[14.5px] tracking-[-0.05px] ${nameWeight} ${nameTone}`}>{name}</Text>
        <View className="mt-0.5 flex-row items-center gap-1.5">
          <Text className="font-sans-black text-[9px] uppercase tracking-[1.3px] text-muted">
            {muscleGroup}
          </Text>
          <Text className="text-[11px] text-muted-dim">·</Text>
          <Text className="font-sans-medium text-[11px] text-muted">{metaText}</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        <Text className={`font-sans-bold text-[12px] ${summaryTone}`}>{summaryText}</Text>
        <ChevronRight color="#4A4A4A" size={16} strokeWidth={2.4} />
      </View>
    </View>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function StatusCircle({ status }: { status: WorkoutExercise['status'] }) {
  if (status === 'done') {
    return (
      <View className="h-[22px] w-[22px] items-center justify-center rounded-full bg-primary">
        <Check color="#0A0A0A" size={13} strokeWidth={3.5} />
      </View>
    );
  }
  if (status === 'current') {
    return (
      <View className="h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px] border-primary">
        <View className="h-[7px] w-[7px] rounded-full bg-primary" />
      </View>
    );
  }
  return (
    <View className="h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px] border-border-strong">
      <Circle color="#4A4A4A" size={11} strokeWidth={2} />
    </View>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function PulseDot() {
  const phase = useSharedValue(0);

  useEffect(() => {
    phase.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.linear }), -1, false);
  }, [phase]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + phase.value * 1.8 }],
    opacity: 0.6 * (1 - phase.value),
  }));

  return (
    <View className="relative h-2.5 w-2.5">
      <View className="absolute inset-0 rounded-full bg-primary" />
      <Animated.View
        className="absolute inset-0 rounded-full bg-primary"
        style={ringStyle}
        pointerEvents="none"
      />
    </View>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function SheetFooter({ onFinish }: { onFinish: () => void }) {
  return (
    <View
      pointerEvents="box-none"
      className="absolute bottom-5 left-[18px] right-[18px] h-14 flex-row items-center justify-between rounded-2xl border border-border-strong bg-surface/90 pl-5 pr-2 backdrop-blur-xl"
      style={{ boxShadow: '0 24px 50px rgba(0,0,0,0.55)' }}
    >
      <View className="flex-row items-center gap-3.5">
        <Text className="font-sans-bold text-[11px] uppercase tracking-[1.3px] text-muted">
          <Text className="font-sans-black text-foreground" style={{ letterSpacing: -0.2 }}>
            9.2
          </Text>
          t
        </Text>
        <Text className="font-sans-bold text-[11px] uppercase tracking-[1.3px] text-muted">
          <Text className="font-sans-black text-foreground" style={{ letterSpacing: -0.2 }}>
            14
          </Text>{' '}
          series
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onFinish}
        className="h-[42px] flex-row items-center gap-1.5 rounded-xl bg-primary px-4 active:opacity-90"
      >
        <Text className="font-sans-black text-[12px] uppercase tracking-[1.3px] text-background">
          Finalizar
        </Text>
        <ChevronRight color="#0A0A0A" size={14} strokeWidth={3} />
      </Pressable>
    </View>
  );
}
