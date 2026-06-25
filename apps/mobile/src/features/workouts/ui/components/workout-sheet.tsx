import { useRepos } from '@/db/repo-provider';
import {
  WorkoutSetRow,
  type WorkoutSetRowHandle,
} from '@/features/workouts/ui/components/workout-set-row';
import {
  type WorkoutExercise,
  formatElapsed,
  useWorkoutSession,
} from '@/features/workouts/ui/contexts/workout-session-context';
import {
  type PreviousSetLabel,
  getPreviousSetValues,
} from '@/features/workouts/use-cases/get-previous-set-values';
import * as Haptics from 'expo-haptics';
import { Check, ChevronDown, ChevronRight, Circle } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/**
 * WorkoutSheet — modal slide-up con LISTA EXPANDIBLE de ejercicios.
 *
 * Cada ejercicio es un acordeón:
 *   - Colapsado: header con estado + summary "3/4"
 *   - Expandido: header + lista de SetRows con inputs peso/reps + check
 *
 * Acordeón single-open: sólo un ejercicio expandido a la vez. Auto-expand
 * del 'current' al abrir el sheet — el usuario llega directo a lo que toca.
 */

export function WorkoutSheet() {
  const {
    activeWorkout,
    progressLabel,
    elapsedSeconds,
    isSheetOpen,
    closeSheet,
    finishWorkout,
    currentExercise,
    totalVolumeKg,
    doneSetsCount,
    updateSet,
    toggleSetDone,
  } = useWorkoutSession();

  const { workout: workoutRepo } = useRepos();

  // ID del ejercicio actualmente expandido en el acordeón.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Mapa exerciseId → array de "Previa" por setIndex. Se carga al iniciar/
  // rehidratar workout. Permanece constante durante la sesión — el "anterior"
  // no cambia mientras estás haciendo el actual.
  const [previousByExercise, setPreviousByExercise] = useState<Record<string, PreviousSetLabel[]>>(
    {},
  );

  // Carga la previa de todos los ejercicios del workout al cambiar de id.
  // Si cambian targetSets en un ejercicio (no debería en F1), reload manual.
  useEffect(() => {
    if (!activeWorkout) {
      setPreviousByExercise({});
      return;
    }
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        activeWorkout.exercises.map(async (ex) => {
          const res = await getPreviousSetValues(workoutRepo, ex.id, ex.targetSets);
          return [ex.id, res.ok ? res.value : []] as const;
        }),
      );
      if (cancelled) return;
      setPreviousByExercise(Object.fromEntries(entries));
    })().catch((err) => console.error('[sheet] load previous values:', err));
    return () => {
      cancelled = true;
    };
  }, [activeWorkout, workoutRepo]);

  // "Para qué exercise YA hicimos auto-expand". Permite:
  //   - Auto-expand al abrir el sheet (autoExpandedFor=null → expand current)
  //   - Auto-expand cuando el current CAMBIA (terminas un ejercicio,
  //     pasa el siguiente a current → expand ese)
  //   - NO re-expandir si el usuario colapsó manualmente el current,
  //     porque autoExpandedFor === currentExercise.id ya.
  const [autoExpandedFor, setAutoExpandedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!isSheetOpen) {
      // Reset al cerrar — la próxima apertura vuelve a auto-expandir.
      setAutoExpandedFor(null);
      setExpandedId(null);
      return;
    }
    // Si hay un current y NO hemos auto-expanded ya para él, expandir.
    if (currentExercise && autoExpandedFor !== currentExercise.id) {
      setExpandedId(currentExercise.id);
      setAutoExpandedFor(currentExercise.id);
    }
  }, [isSheetOpen, currentExercise, autoExpandedFor]);

  return (
    <Modal visible={isSheetOpen} transparent animationType="slide" onRequestClose={closeSheet}>
      <Pressable
        accessibilityLabel="Cerrar sheet"
        onPress={closeSheet}
        className="flex-1 bg-black/55"
      >
        {/* KeyboardAvoidingView: en iOS empuja el sheet hacia arriba cuando
            sale el teclado para que los inputs sigan visibles. En Android
            la system UI ya lo gestiona — undefined behavior. */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <Pressable
            onPress={() => {}}
            style={{ backgroundColor: '#0A0A0A' }}
            className="absolute right-0 bottom-0 left-0 h-[92%] rounded-t-[32px] border-border-strong border-t"
          >
            {/* Handle visual */}
            <View className="items-center pt-2 pb-1">
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
              keyboardShouldPersistTaps="handled"
            >
              {activeWorkout?.exercises.map((ex) => (
                <ExerciseSection
                  key={ex.id}
                  exercise={ex}
                  previousLabels={previousByExercise[ex.id] ?? []}
                  isExpanded={expandedId === ex.id}
                  onToggle={() => setExpandedId(expandedId === ex.id ? null : ex.id)}
                  onUpdateSet={(idx, patch) => updateSet(ex.id, idx, patch)}
                  onToggleSetDone={(idx) => toggleSetDone(ex.id, idx)}
                />
              ))}
            </ScrollView>

            <SheetFooter
              volumeKg={totalVolumeKg}
              doneSets={doneSetsCount}
              onFinish={() => {
                finishWorkout().catch((err) => console.error('[sheet] finishWorkout error:', err));
              }}
            />
          </Pressable>
        </KeyboardAvoidingView>
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
    <View className="border-border border-b px-6 pb-5">
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="font-sans-bold text-[10px] text-muted uppercase tracking-[1.8px]">
          Entreno activo
          {progressLabel ? (
            <Text className="font-sans-bold text-primary"> · {progressLabel}</Text>
          ) : null}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Minimizar"
          onPress={onClose}
          className="h-10 w-10 items-center justify-center rounded-full border border-border-strong bg-surface active:opacity-70"
          hitSlop={10}
        >
          <ChevronDown color="#FAFAFA" size={18} strokeWidth={2.6} />
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
        <Text className="ml-auto self-center font-sans-bold text-[10px] text-muted uppercase tracking-[1.8px]">
          Tiempo total
        </Text>
      </View>

      <View className="mt-3.5 flex-row items-baseline">
        <Text className="font-sans-bold text-[13px] text-foreground tracking-[-0.05px]">
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

type ExerciseSectionProps = {
  exercise: WorkoutExercise;
  /** Valores del último workout para esta misma posición. Index alineado con `sets`. */
  previousLabels: PreviousSetLabel[];
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateSet: (setIndex: number, patch: { reps?: number; weight?: number }) => void;
  onToggleSetDone: (setIndex: number) => void;
};

function ExerciseSection({
  exercise,
  previousLabels,
  isExpanded,
  onToggle,
  onUpdateSet,
  onToggleSetDone,
}: ExerciseSectionProps) {
  const { name, muscleGroup, targetSets, targetReps, status, currentSet, sets } = exercise;

  // Refs por SetRow para auto-focus al siguiente al marcar done.
  const setRefs = useRef<(WorkoutSetRowHandle | null)[]>([]);
  setRefs.current = setRefs.current.slice(0, sets.length);

  // Animación de chevron: 0° colapsado (apunta abajo) → 180° expandido
  // (apunta arriba). Mismo patrón que el mockup.
  const chevronPhase = useSharedValue(isExpanded ? 1 : 0);
  useEffect(() => {
    chevronPhase.value = withSpring(isExpanded ? 1 : 0, {
      damping: 18,
      stiffness: 180,
    });
  }, [isExpanded, chevronPhase]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronPhase.value * 180}deg` }],
  }));

  // Estado por set:
  //   done    → s.done === true
  //   active  → primer set NO-done (sólo uno por ejercicio)
  //   pending → resto de no-done después del active
  const activeSetIdx = sets.findIndex((s) => !s.done);

  // Wrapper de toggleSetDone — si estamos marcando como done (no como
  // undo), avanza el foco al peso del siguiente set no-completado.
  const handleSetToggle = (setIdx: number) => {
    const wasDone = sets[setIdx]?.done ?? false;
    onToggleSetDone(setIdx);
    if (!wasDone) {
      // Buscar el primer set NO-done después de éste para auto-focus.
      // Esperamos al siguiente tick para que el estado se actualice.
      requestAnimationFrame(() => {
        for (let i = setIdx + 1; i < sets.length; i++) {
          const next = sets[i];
          if (next && !next.done) {
            setRefs.current[i]?.focusWeight();
            return;
          }
        }
      });
    }
  };

  const doneSets = sets.filter((s) => s.done).length;

  const metaText =
    status === 'current' && currentSet !== null
      ? `Serie ${currentSet} / ${targetSets}`
      : `${targetSets} series`;

  const summaryText =
    status === 'done'
      ? `${targetSets} / ${targetSets}`
      : status === 'current'
        ? `${doneSets} / ${targetSets}`
        : `${targetSets} × ${targetReps}`;

  const nameTone = status === 'current' ? 'text-foreground' : 'text-muted';
  const nameWeight = status === 'current' ? 'font-sans-bold' : 'font-sans-medium';
  const summaryTone =
    status === 'done' ? 'text-primary' : status === 'current' ? 'text-foreground' : 'text-muted';

  return (
    // Sin layout animation en el padre — eso causaba que el contenido
    // pareciera "estirarse" durante la transición. Sólo animamos opacidad
    // del bloque expandido. La altura cambia instantáneamente, el fade
    // suaviza la aparición/desaparición.
    <View
      style={{ backgroundColor: '#141414' }}
      className="overflow-hidden rounded-[18px] border border-border"
    >
      {/* Header tappable — toggle expand. Haptic ligero al abrir/cerrar. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${isExpanded ? 'Colapsar' : 'Expandir'} ${name}`}
        accessibilityState={{ expanded: isExpanded }}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.selectionAsync().catch(() => {});
          }
          onToggle();
        }}
        className="flex-row items-center gap-3 px-4 py-4 active:opacity-90"
      >
        <StatusCircle status={status} />

        <View className="min-w-0 flex-1">
          <Text className={`text-[14.5px] tracking-[-0.05px] ${nameWeight} ${nameTone}`}>
            {name}
          </Text>
          <View className="mt-0.5 flex-row items-center gap-1.5">
            <Text className="font-sans-black text-[9px] text-muted uppercase tracking-[1.3px]">
              {muscleGroup}
            </Text>
            <Text className="text-[11px] text-muted-dim">·</Text>
            <Text className="font-sans-medium text-[11px] text-muted">{metaText}</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <Text className={`font-sans-bold text-[12px] ${summaryTone}`}>{summaryText}</Text>
          {/* Chevron-down rota 180° al expandir — afín al mockup workout.html. */}
          <Animated.View style={chevronStyle}>
            <ChevronDown color="#8A8A8A" size={18} strokeWidth={2.4} />
          </Animated.View>
        </View>
      </Pressable>

      {/* Lista de sets — sólo si expandido */}
      {isExpanded ? (
        // Fade puro — entra en 150ms, sale en 100ms. Sin animación de
        // altura: el contenedor crece instantáneamente y el contenido se
        // desvanece. Sin "estirado" perceptible del texto.
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          className="gap-2 border-border border-t px-2.5 pt-3.5 pb-4"
        >
          {/* Header de 5 columnas alineado con los anchos del SetRow:
              [w-6 set#] [w-58 previa] [flex peso] [flex reps] [w-9 check] */}
          <View className="mb-0.5 flex-row items-center gap-1.5 px-2">
            <Text className="w-6 text-center font-sans-bold text-[9px] text-muted-dim uppercase tracking-[1.3px]">
              Set
            </Text>
            <Text
              style={{ width: 58 }}
              className="text-center font-sans-bold text-[9px] text-muted-dim uppercase tracking-[1.3px]"
            >
              Previa
            </Text>
            <Text className="flex-1 text-center font-sans-bold text-[9px] text-muted-dim uppercase tracking-[1.3px]">
              Kg
            </Text>
            <Text className="flex-1 text-center font-sans-bold text-[9px] text-muted-dim uppercase tracking-[1.3px]">
              Reps
            </Text>
            <View className="w-9" />
          </View>

          {sets.map((set, idx) => {
            // Estado: done > active (primer no-done) > pending (resto)
            const setState: 'done' | 'active' | 'pending' = set.done
              ? 'done'
              : idx === activeSetIdx
                ? 'active'
                : 'pending';
            return (
              <WorkoutSetRow
                key={`${exercise.id}-set-${idx}`}
                ref={(handle) => {
                  setRefs.current[idx] = handle;
                }}
                setNumber={idx + 1}
                set={set}
                state={setState}
                unit="kg"
                previousLabel={formatPreviousLabel(previousLabels[idx] ?? null)}
                onUpdate={(patch) => onUpdateSet(idx, patch)}
                onToggleDone={() => handleSetToggle(idx)}
              />
            );
          })}

          {/* Reps target hint */}
          <Text className="mt-1 text-center font-sans text-[10px] text-muted-dim">
            Objetivo: {targetReps} reps
          </Text>
        </Animated.View>
      ) : null}
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

type SheetFooterProps = {
  volumeKg: number;
  doneSets: number;
  onFinish: () => void;
};

function SheetFooter({ volumeKg, doneSets, onFinish }: SheetFooterProps) {
  // Formato compacto del volumen: si >= 1000, mostrar en toneladas con 1 decimal.
  const volumeLabel =
    volumeKg >= 1000
      ? `${(volumeKg / 1000).toFixed(1).replace(/\.0$/, '')}t`
      : `${Math.round(volumeKg)}kg`;

  return (
    <View
      pointerEvents="box-none"
      className="absolute right-[18px] bottom-5 left-[18px] h-14 flex-row items-center justify-between rounded-2xl border border-border-strong bg-surface/90 pr-2 pl-5 backdrop-blur-xl"
      style={{ boxShadow: '0 24px 50px rgba(0,0,0,0.55)' }}
    >
      <View className="flex-row items-center gap-3.5">
        <Text className="font-sans-bold text-[11px] text-muted uppercase tracking-[1.3px]">
          <Text className="font-sans-black text-foreground" style={{ letterSpacing: -0.2 }}>
            {volumeLabel}
          </Text>
        </Text>
        <Text className="font-sans-bold text-[11px] text-muted uppercase tracking-[1.3px]">
          <Text className="font-sans-black text-foreground" style={{ letterSpacing: -0.2 }}>
            {doneSets}
          </Text>{' '}
          series
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onFinish}
        className="h-[42px] flex-row items-center gap-1.5 rounded-xl bg-primary px-4 active:opacity-90"
      >
        <Text className="font-sans-black text-[12px] text-background uppercase tracking-[1.3px]">
          Finalizar
        </Text>
        <ChevronRight color="#0A0A0A" size={14} strokeWidth={3} />
      </Pressable>
    </View>
  );
}

// "62 × 12" — formato del mockup. Weight con hasta 1 decimal (62.5),
// reps entero. null → em-dash en la celda.
function formatPreviousLabel(label: PreviousSetLabel): string | null {
  if (!label) return null;
  if (typeof label.weight !== 'number' || typeof label.reps !== 'number') return null;
  const weightStr = Number.isInteger(label.weight) ? String(label.weight) : label.weight.toFixed(1);
  return `${weightStr} × ${label.reps}`;
}
