import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Exercise } from '@/features/exercises/domain/exercise';
import type { Routine } from '@/features/routines/domain/routine';
import { Text, View } from 'react-native';

interface TodayWorkoutCardProps {
  routine: Routine;
  catalogById: Map<string, Exercise>;
  activeWorkout: boolean;
  onStart: () => void;
  onFinishDev: () => void;
}

export function TodayWorkoutCard({
  routine,
  catalogById,
  activeWorkout,
  onStart,
  onFinishDev,
}: TodayWorkoutCardProps) {
  const muscleSummary = (() => {
    const set = new Set<string>();
    for (const re of routine.exercises) {
      const ex = catalogById.get(re.exerciseId);
      if (!ex) continue;
      for (const mg of ex.muscleGroups) set.add(mg.group);
    }
    return Array.from(set)
      .slice(0, 3)
      .map((g) => g.charAt(0).toUpperCase() + g.slice(1))
      .join(' · ');
  })();

  const totalSets = routine.exercises.reduce((acc, re) => acc + re.targetSets, 0);
  const exCount = routine.exercises.length;
  
  const metaLine = [
    muscleSummary,
    `${exCount} ejercicio${exCount === 1 ? '' : 's'}`,
    `${totalSets} series`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card glow>
      <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
        Hoy toca
      </Text>
      <Text
        className="mt-2 font-sans-black text-3xl tracking-[-0.5px] text-foreground"
        numberOfLines={2}
      >
        {routine.name}
      </Text>
      <Text className="mt-1 font-sans text-sm text-muted">{metaLine}</Text>
      <View className="mt-4">
        {activeWorkout ? (
          <Button variant="secondary" onPress={onFinishDev}>
            Finalizar entreno (dev)
          </Button>
        ) : (
          <Button onPress={onStart} disabled={exCount === 0}>
            {exCount === 0 ? 'Añade ejercicios primero' : 'Empezar entreno'}
          </Button>
        )}
      </View>
    </Card>
  );
}
