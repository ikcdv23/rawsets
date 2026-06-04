import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import type { RoutineExercise } from '../../domain/routine';

// Fila de un ejercicio dentro del detalle de rutina, replica del mockup:
//
//   [1] | Peso muerto                    4 × 6
//       | ESPALDA
//
// Dos modos:
//  - `reorderMode=false` → tap en cualquier parte abre el modal de edición.
//    Eyebrow: chevron derecho como afordancia "abre detalle".
//  - `reorderMode=true`  → la fila no es tappable. En lugar del chevron,
//    aparecen ▲/▼ que invocan `onMoveUp` / `onMoveDown`. Los bordes (primero
//    y último) muestran el botón deshabilitado.
export type RoutineExerciseRowProps = {
  re: RoutineExercise;
  position: number;
  name: string;
  muscleSummary: string;
  reorderMode: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onPress: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function RoutineExerciseRow({
  re,
  position,
  name,
  muscleSummary,
  reorderMode,
  canMoveUp,
  canMoveDown,
  onPress,
  onMoveUp,
  onMoveDown,
}: RoutineExerciseRowProps) {
  const repsLabel =
    re.targetRepsMin === re.targetRepsMax
      ? `${re.targetRepsMin}`
      : `${re.targetRepsMin}-${re.targetRepsMax}`;

  const content = (
    <View
      className="flex-row items-center gap-3 overflow-hidden rounded-[16px] border border-border px-3.5 py-3"
      style={{ backgroundColor: '#141414' }}
    >
      <View className="h-7 w-7 items-center justify-center rounded-full">
        <Text className="font-sans-black text-[14px] text-muted">{position}</Text>
      </View>

      <View className="min-w-0 flex-1">
        <Text
          className="font-sans-bold text-[14px] tracking-[-0.05px] text-foreground"
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text
          className="mt-0.5 font-sans-bold text-[9px] uppercase tracking-[1.4px] text-muted"
          numberOfLines={1}
        >
          {muscleSummary}
        </Text>
      </View>

      {reorderMode ? (
        <View className="flex-row gap-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Mover ${name} arriba`}
            onPress={onMoveUp}
            disabled={!canMoveUp}
            hitSlop={6}
            className={[
              'h-8 w-8 items-center justify-center rounded-md border border-border bg-surface',
              canMoveUp ? 'active:opacity-70' : 'opacity-30',
            ].join(' ')}
          >
            <ChevronUp color="#FAFAFA" size={16} strokeWidth={2.4} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Mover ${name} abajo`}
            onPress={onMoveDown}
            disabled={!canMoveDown}
            hitSlop={6}
            className={[
              'h-8 w-8 items-center justify-center rounded-md border border-border bg-surface',
              canMoveDown ? 'active:opacity-70' : 'opacity-30',
            ].join(' ')}
          >
            <ChevronDown color="#FAFAFA" size={16} strokeWidth={2.4} />
          </Pressable>
        </View>
      ) : (
        <Text
          className="font-sans-bold text-[14px] text-foreground"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {re.targetSets} <Text className="text-muted">×</Text> {repsLabel}
        </Text>
      )}
    </View>
  );

  // En modo reorder no es Pressable — los únicos taps válidos son las flechas.
  if (reorderMode) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Editar ${name}`}
      className="active:opacity-80"
    >
      {content}
    </Pressable>
  );
}
