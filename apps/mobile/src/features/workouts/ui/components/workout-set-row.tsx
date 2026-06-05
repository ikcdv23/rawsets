import type { SetLog } from '@/features/workouts/ui/contexts/workout-session-context';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  type TextInput as RNTextInput,
  Text,
  TextInput,
  View,
} from 'react-native';

// Fila para LOGUEAR una serie — espejo del mockup workout.html.
//
// 5 columnas con anchos asimétricos:
//   [#  ]  [Previa  ]  [Kg  ]  [Reps]  [✓]
//   24      ~58        flex    flex     36
//
// Tres ESTADOS visuales:
//   - done:    serie completada. Inputs readonly muted, check lima sólido.
//   - active:  la PRÓXIMA serie a hacer (la primera no-done). Inputs
//              editables, número lima, check outline lima.
//   - pending: series futuras. Editables pero visualmente atenuadas.
//              Pueden venir pre-rellenas con valores del set anterior.
//
// "Previa": muestra "62 × 12" con los valores del MISMO setNumber en el
// último workout que tenga este ejercicio. Útil para saber qué progresión
// llevas. Para sets sin histórico → em-dash.
// El padre pasa `previousLabel` calculado; el row sólo renderiza.

export type WorkoutSetRowHandle = {
  focusWeight: () => void;
};

export type SetRowState = 'done' | 'active' | 'pending';

type WorkoutSetRowProps = {
  setNumber: number;
  set: SetLog;
  state: SetRowState;
  unit: 'kg' | 'lb';
  // "62 × 12" o null si no hay histórico para esta posición.
  previousLabel: string | null;
  onUpdate: (patch: Partial<Pick<SetLog, 'reps' | 'weight'>>) => void;
  onToggleDone: () => void;
};

export const WorkoutSetRow = forwardRef<WorkoutSetRowHandle, WorkoutSetRowProps>(
  function WorkoutSetRow({ setNumber, set, state, previousLabel, onUpdate, onToggleDone }, ref) {
    const weightRef = useRef<RNTextInput>(null);
    const repsRef = useRef<RNTextInput>(null);

    useImperativeHandle(ref, () => ({
      focusWeight: () => weightRef.current?.focus(),
    }));

    const [weightStr, setWeightStr] = useState(set.weight > 0 ? String(set.weight) : '');
    const [repsStr, setRepsStr] = useState(set.reps > 0 ? String(set.reps) : '');

    useEffect(() => {
      setWeightStr(set.weight > 0 ? String(set.weight) : '');
      setRepsStr(set.reps > 0 ? String(set.reps) : '');
    }, [set.weight, set.reps]);

    const handleWeightChange = (text: string) => {
      setWeightStr(text);
      const parsed = Number.parseFloat(text.replace(',', '.'));
      if (Number.isFinite(parsed) && parsed >= 0) {
        onUpdate({ weight: parsed });
      } else if (text === '') {
        onUpdate({ weight: 0 });
      }
    };

    const handleRepsChange = (text: string) => {
      setRepsStr(text);
      const parsed = Number.parseInt(text, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        onUpdate({ reps: parsed });
      } else if (text === '') {
        onUpdate({ reps: 0 });
      }
    };

    const handleToggleDone = () => {
      if (Platform.OS !== 'web') {
        const style = set.done
          ? Haptics.ImpactFeedbackStyle.Light
          : Haptics.ImpactFeedbackStyle.Medium;
        Haptics.impactAsync(style).catch(() => {});
      }
      onToggleDone();
    };

    const isDone = state === 'done';
    const isActive = state === 'active';

    // Estilos por estado — variantes-como-datos.
    const rowClasses = isDone
      ? 'border-primary/30'
      : isActive
        ? 'border-primary/60'
        : 'border-border';
    const rowStyle = isDone
      ? { backgroundColor: 'rgba(168, 224, 85, 0.06)' }
      : isActive
        ? { backgroundColor: 'rgba(168, 224, 85, 0.04)' }
        : undefined;

    const numColor = isDone ? 'text-muted' : isActive ? 'text-primary' : 'text-muted-dim';

    const inputClasses = isDone
      ? 'border-transparent bg-transparent'
      : isActive
        ? 'border-primary/40 bg-background'
        : 'border-border-strong bg-background';

    return (
      <View
        className={['flex-row items-center gap-1.5 rounded-xl border px-2 py-2', rowClasses].join(
          ' ',
        )}
        style={rowStyle}
      >
        {/* Set number */}
        <View className="w-6 items-center">
          <Text className={['font-mono-bold text-[13px]', numColor].join(' ')}>{setNumber}</Text>
        </View>

        {/* Previa — info-only, no editable. "62 × 12" o em-dash. */}
        <View style={{ width: 58 }}>
          <Text className="text-center font-mono text-[10.5px] text-muted-dim" numberOfLines={1}>
            {previousLabel ?? '—'}
          </Text>
        </View>

        {/* Peso input */}
        <View
          style={{ minWidth: 0 }}
          className={['flex-1 rounded-lg border', inputClasses].join(' ')}
        >
          <TextInput
            ref={weightRef}
            value={weightStr}
            onChangeText={handleWeightChange}
            placeholder="0"
            placeholderTextColor="#3A3A3A"
            keyboardType="decimal-pad"
            editable={!isDone}
            returnKeyType="next"
            onSubmitEditing={() => repsRef.current?.focus()}
            blurOnSubmit={false}
            selectTextOnFocus
            className={[
              'h-9 px-2 text-center font-mono-bold text-[14px]',
              isDone ? 'text-muted' : 'text-foreground',
            ].join(' ')}
          />
        </View>

        {/* Reps input */}
        <View
          style={{ minWidth: 0 }}
          className={['flex-1 rounded-lg border', inputClasses].join(' ')}
        >
          <TextInput
            ref={repsRef}
            value={repsStr}
            onChangeText={handleRepsChange}
            placeholder="0"
            placeholderTextColor="#3A3A3A"
            keyboardType="number-pad"
            editable={!isDone}
            returnKeyType="done"
            selectTextOnFocus
            className={[
              'h-9 px-2 text-center font-mono-bold text-[14px]',
              isDone ? 'text-muted' : 'text-foreground',
            ].join(' ')}
          />
        </View>

        {/* Check */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isDone ? 'Marcar serie como no hecha' : 'Marcar serie como hecha'}
          accessibilityState={{ checked: isDone }}
          onPress={handleToggleDone}
          hitSlop={10}
          className={[
            'h-9 w-9 items-center justify-center rounded-lg active:opacity-80',
            isDone
              ? 'bg-primary'
              : isActive
                ? 'border-[1.5px] border-primary bg-primary/10'
                : 'border-[1.5px] border-border-strong bg-surface-2',
          ].join(' ')}
        >
          {isDone ? (
            <Check color="#0A0A0A" size={16} strokeWidth={3} />
          ) : isActive ? (
            <Check color="#A8E055" size={16} strokeWidth={3} />
          ) : null}
        </Pressable>
      </View>
    );
  },
);
