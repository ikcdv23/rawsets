import type { Exercise } from '@/features/exercises/domain/exercise';
import { Check, ChevronRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Routine } from '../../domain/routine';

const ROUTINE_COLORS = {
  lime: '#A8E055',
  amber: '#F5C24E',
  teal: '#5DD6C8',
} as const;

function colorForName(name: string): string {
  const ch = name.trim().slice(0, 1).toUpperCase();
  if (ch === 'E') return ROUTINE_COLORS.amber;
  if (ch === 'P') return ROUTINE_COLORS.teal;
  return ROUTINE_COLORS.lime;
}

function initialOf(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || '·';
}

// Card de rutina. Comportamiento depende de si la pantalla está en modo
// selección o no — la card NO conoce ese estado, simplemente delega:
//
//   onPress     → tap corto. Parent decide (abrir vs toggle selection).
//   onLongPress → tap largo. Parent decide (entrar en selection + select).
//   selected    → muestra check + borde lima. Visual de "elegida".
//
// El badge de la izquierda se sustituye por un check verde cuando está
// seleccionada — feedback claro de "estás en modo selección y esta está marcada".
export type RoutineCardProps = {
  routine: Routine;
  catalogById: Map<string, Exercise>;
  onPress: () => void;
  onLongPress: () => void;
  selected?: boolean;
};

export function RoutineCard({
  routine,
  catalogById,
  onPress,
  onLongPress,
  selected = false,
}: RoutineCardProps) {
  const muscleSummary = useMemo(() => {
    const set = new Set<string>();
    for (const re of routine.exercises) {
      const ex = catalogById.get(re.exerciseId);
      if (!ex) continue;
      for (const mg of ex.muscleGroups) {
        set.add(mg.group);
      }
    }
    const groups = Array.from(set).slice(0, 3);
    return groups.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(' · ');
  }, [routine.exercises, catalogById]);

  const color = colorForName(routine.name);
  const letter = initialOf(routine.name);
  const exCount = routine.exercises.length;

  // Borde lima cuando está seleccionada — más visible que un fondo distinto.
  const borderColor = selected ? '#A8E055' : '#1F1F1F';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      // delayLongPress en ms — default 500, lo bajamos un pelín para
      // feedback más rápido sin disparar long-press por accidente al tap.
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityLabel={selected ? `${routine.name} (seleccionada)` : `Abrir ${routine.name}`}
      accessibilityState={{ selected }}
      className="active:opacity-80"
    >
      <View
        className="flex-row items-center gap-3 overflow-hidden rounded-[16px] p-3.5"
        style={{ backgroundColor: '#141414', borderWidth: 1, borderColor }}
      >
        {/* Badge: letra coloreada por defecto, check lima cuando seleccionada */}
        {selected ? (
          <View
            className="h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: '#A8E055' }}
          >
            <Check color="#0A0A0A" size={20} strokeWidth={3} />
          </View>
        ) : (
          <View
            className="h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${color}1A`, borderWidth: 1, borderColor: `${color}55` }}
          >
            <Text className="font-sans-black text-[18px]" style={{ color, letterSpacing: -0.5 }}>
              {letter}
            </Text>
          </View>
        )}

        <View className="min-w-0 flex-1">
          <Text
            className="font-sans-black text-[15px] tracking-[-0.2px] text-foreground"
            numberOfLines={1}
          >
            {routine.name}
          </Text>
          <Text className="mt-0.5 font-sans-medium text-[12px] text-muted" numberOfLines={1}>
            {muscleSummary || 'Sin ejercicios'}
            {exCount > 0 ? (
              <>
                {muscleSummary ? ' · ' : ''}
                <Text className="font-sans-bold text-foreground">{exCount} ej</Text>
              </>
            ) : null}
          </Text>
        </View>

        {!selected ? <ChevronRight color="#4A4A4A" size={18} strokeWidth={2.4} /> : null}
      </View>
    </Pressable>
  );
}
