import { Pressable, Text, View } from 'react-native';

// Una celda del calendario mensual.
//
// Estados visuales:
//   - other-month  → día del mes anterior/siguiente, gris muy claro, no tappable
//   - empty        → mes actual, sin asignación, número en blanco
//   - rest         → asignado como descanso (routineId null), número + "·"
//   - assigned     → asignado a rutina, número + letra + dot del color
//   - today        → borde lima alrededor de la celda (puede combinarse con los anteriores)
//
// La altura es fija ~52px para que cuadrícula sea consistente independientemente
// del contenido. El dot va arriba a la derecha como en el mockup.
export type CalendarDayCellProps = {
  day: number;
  letter?: string | null;
  color?: string | null;
  isOtherMonth: boolean;
  isToday: boolean;
  isRest: boolean;
  onPress: () => void;
};

export function CalendarDayCell({
  day,
  letter,
  color,
  isOtherMonth,
  isToday,
  isRest,
  onPress,
}: CalendarDayCellProps) {
  // other-month no es tappable — no quieres asignar a un día fuera del mes
  // visible sin pasar primero por su mes propio.
  if (isOtherMonth) {
    return (
      <View className="h-[52px] items-center justify-center rounded-md">
        <Text className="font-sans-bold text-[11px] text-muted-dim/40">{day}</Text>
      </View>
    );
  }

  const numberColor =
    letter || isRest ? 'text-foreground' : isToday ? 'text-primary' : 'text-foreground';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Día ${day}${letter ? ` (${letter})` : isRest ? ' (descanso)' : ''}`}
      onPress={onPress}
      className="h-[52px] items-center justify-center active:opacity-70"
      style={
        isToday
          ? {
              borderWidth: 1.5,
              borderColor: '#A8E055',
              borderRadius: 8,
              backgroundColor: 'rgba(168, 224, 85, 0.05)',
            }
          : undefined
      }
    >
      {/* dot indicador arriba derecha */}
      {color ? (
        <View
          className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      ) : null}

      {/* número del día */}
      <Text className={['font-sans-black text-[12px]', numberColor].join(' ')}>{day}</Text>

      {/* letra de la rutina (T, E, P…) o "·" si es descanso */}
      {letter ? (
        <Text
          className="mt-0.5 font-sans-black text-[13px]"
          style={{ color: color ?? '#FAFAFA', lineHeight: 14 }}
        >
          {letter}
        </Text>
      ) : isRest ? (
        <Text className="mt-0.5 font-sans-black text-[14px] text-muted">·</Text>
      ) : null}
    </Pressable>
  );
}
