import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InfoModal } from '@/components/ui/info-modal';
import { AvatarIcon } from '@/components/ui/profile/avatar-icon';
import type { RadarAxis } from '@/components/ui/radar-chart';
import { SectionHeader } from '@/components/ui/section-header';
import { Stat } from '@/components/ui/stat';
import { useRepos } from '@/db/repo-provider';
import type { Exercise } from '@/features/exercises/domain/exercise';
import type { MuscleGroup } from '@/features/exercises/domain/muscle-groups';
import { listExercises } from '@/features/exercises/use-cases/list-exercises';
import type { Routine } from '@/features/routines/domain/routine';
import { addDays, startOfDay } from '@/features/scheduling/domain/dates';
import type { ScheduledSession } from '@/features/scheduling/domain/scheduled-session';
import { listScheduledInRange } from '@/features/scheduling/use-cases/list-scheduled-in-range';
import { BalanceRadar } from '@/features/workouts/ui/components/radar';
import {
  type StartWorkoutExercise,
  useWorkoutSession,
} from '@/features/workouts/ui/contexts/workout-session-context';
import {
  type MuscleBalanceItem,
  computeMuscleVolumeByRange,
} from '@/features/workouts/use-cases/compute-muscle-volume-by-range';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

// Mapping de grupos planos (11) → ejes del radar (6). Los 11 grupos del dominio
// son granulares para que la lógica de balance sea precisa; el radar agrupa por
// región para que sea LEGIBLE de un vistazo. Si Fase 2 añade stats screen con
// los 11, esa pantalla usa otro mapeo (o ninguno).
const RADAR_AXES: Array<{ label: string; groups: MuscleGroup[] }> = [
  { label: 'Pecho', groups: ['pecho'] },
  { label: 'Brazos', groups: ['biceps', 'triceps', 'antebrazo'] },
  { label: 'Piernas', groups: ['cuadriceps', 'isquios', 'gluteo', 'pantorrilla'] },
  { label: 'Core', groups: ['core'] },
  { label: 'Espalda', groups: ['espalda'] },
  { label: 'Hombros', groups: ['hombro'] },
];

const RADAR_EMPTY: RadarAxis[] = RADAR_AXES.map((a) => ({ label: a.label, value: 0 }));

// Construye los 6 ejes del radar agregando volumen por región.
// El flag de eje "más bajo" se activa SÓLO si:
//   1. Hay histórico (algún eje con volumen > 0)
//   2. El eje más bajo está por debajo de 60% del máximo
// Sin esos dos criterios juntos no hay nada "que alarmar" todavía.
function buildRadarAxes(balance: MuscleBalanceItem[]): {
  axes: RadarAxis[];
  flaggedLabel: string | null;
} {
  const byGroup = new Map(balance.map((b) => [b.muscleGroup, b]));
  const aggregated = RADAR_AXES.map(({ label, groups }) => {
    let volumeKg = 0;
    for (const g of groups) volumeKg += byGroup.get(g)?.volumeKg ?? 0;
    return { label, volumeKg };
  });
  const maxVolume = Math.max(0, ...aggregated.map((a) => a.volumeKg));
  if (maxVolume === 0) {
    return { axes: RADAR_EMPTY, flaggedLabel: null };
  }
  const axes = aggregated.map(({ label, volumeKg }) => ({
    label,
    value: Math.round((volumeKg / maxVolume) * 100),
  }));
  // axes nunca está vacío — RADAR_AXES tiene 6 elementos hardcoded — pero
  // TS no lo sabe. reduce sin initial value sobre array no vacío es seguro.
  const lowestValue = Math.min(...axes.map((a) => a.value));
  const lowestAxis = axes.find((a) => a.value === lowestValue);
  const flaggedLabel = lowestAxis && lowestAxis.value < 60 ? lowestAxis.label : null;
  const axesWithFlag = axes.map(
    (a): RadarAxis => (a.label === flaggedLabel ? { ...a, flagged: true } : a),
  );
  return { axes: axesWithFlag, flaggedLabel };
}

// Tres estados de "Sesión de hoy", derivados de los datos reales:
//   workout → hay scheduled_session con routineId apuntando a una rutina viva
//   rest    → hay scheduled_session con routineId = null
//   free    → no hay scheduled_session para hoy
type TodayState = { kind: 'workout'; routine: Routine } | { kind: 'rest' } | { kind: 'free' };

export default function HomeScreen() {
  const router = useRouter();
  const {
    routine: routineRepo,
    exercise: exerciseRepo,
    schedule: scheduleRepo,
    workout: workoutRepo,
  } = useRepos();

  const [radarInfoOpen, setRadarInfoOpen] = useState(false);
  const { activeWorkout, startWorkout, finishWorkout } = useWorkoutSession();

  const [todaySession, setTodaySession] = useState<ScheduledSession | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [muscleBalance, setMuscleBalance] = useState<MuscleBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const now = new Date();
      const today = startOfDay(now);
      const tomorrow = addDays(today, 1);
      // Ventana del radar: últimos 14 días. El +1ms en `to` evita borderline
      // del momento actual sin pelearse con timestamps.
      const radarFrom = addDays(today, -13);
      const radarTo = new Date(now.getTime() + 1);
      // Cuatro queries en paralelo — independientes entre sí.
      const [schRes, rsRes, catRes, balanceRes] = await Promise.all([
        listScheduledInRange(scheduleRepo, today, tomorrow),
        routineRepo.list(),
        listExercises(exerciseRepo),
        computeMuscleVolumeByRange(workoutRepo, radarFrom, radarTo),
      ]);

      if (schRes.ok) setTodaySession(schRes.value[0] ?? null);
      if (rsRes.ok) setRoutines(rsRes.value);
      if (catRes.ok) setCatalog(catRes.value);
      if (balanceRes.ok) setMuscleBalance(balanceRes.value);

      // Opcional: loggear errores si alguno falló
      [schRes, rsRes, catRes, balanceRes].forEach((r) => {
        if (!r.ok) console.error('[home] load error:', r.error);
      });
    } catch (err) {
      console.error('[home] unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, [scheduleRepo, routineRepo, exerciseRepo, workoutRepo]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  // Lookup rápido de ejercicios para enriquecer la rutina del día.
  const catalogById = useMemo(() => new Map(catalog.map((e) => [e.id, e])), [catalog]);
  const routinesById = useMemo(() => new Map(routines.map((r) => [r.id, r])), [routines]);

  // Radar: agrego los 11 grupos planos en los 6 ejes visuales del mockup.
  // `hasHistory` es true sólo si CUALQUIER eje tiene volumen > 0 — sin
  // entrenos completos no hay nada que pintar.
  const { axes: radarAxes, flaggedLabel } = useMemo(
    () => buildRadarAxes(muscleBalance),
    [muscleBalance],
  );
  const hasHistory = muscleBalance.some((b) => b.volumeKg > 0);

  // Derivación del estado de hoy. Esta lógica vive aquí porque es de UI;
  // si la necesitara más de una pantalla, subiría a un use case puro
  // (`resolveTodayState(session, routines)`).
  const today: TodayState = useMemo(() => {
    if (!todaySession) return { kind: 'free' };
    if (todaySession.routineId === null) return { kind: 'rest' };
    const r = routinesById.get(todaySession.routineId);
    if (!r) return { kind: 'free' }; // rutina borrada, tratamos como libre
    return { kind: 'workout', routine: r };
  }, [todaySession, routinesById]);

  return (
    <View className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-3 px-6 pb-32 pt-8">
          {/* Top bar: wordmark a la izquierda, avatar (→ perfil) a la derecha. */}
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-sans-black text-3xl tracking-[-0.5px] text-foreground">
              RAWSETS<Text className="text-primary">.</Text>
            </Text>
            <AvatarIcon />
          </View>

          {/* Hero: balance muscular (radar). */}
          <SectionHeader>Balance muscular</SectionHeader>
          <BalanceRadar
            data={hasHistory ? radarAxes : RADAR_EMPTY}
            empty={!hasHistory}
            onPressInfo={() => setRadarInfoOpen(true)}
            alertLabel={flaggedLabel ? `${flaggedLabel} bajo` : null}
          />

          {/* Resumen: 4 KPIs en grid 2x2. "—" cuando no hay histórico. */}
          <SectionHeader>Resumen</SectionHeader>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Stat
                label="Volumen sem"
                value={hasHistory ? '12.4' : '—'}
                unit={hasHistory ? 't' : undefined}
              />
            </View>
            <View className="flex-1">
              <Stat
                label="Sesiones"
                value={hasHistory ? '4' : '—'}
                unit={hasHistory ? '/5' : undefined}
              />
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Stat
                label="PRs · mes"
                value={hasHistory ? '3' : '—'}
                tone={hasHistory ? 'primary' : 'default'}
              />
            </View>
            <View className="flex-1">
              <Stat
                label="Grupos OK"
                value={hasHistory ? '8' : '—'}
                unit={hasHistory ? '/11' : undefined}
                tone={hasHistory ? 'destructive' : 'default'}
              />
            </View>
          </View>

          {/* Sesión de hoy — tres variantes derivadas de scheduled_sessions. */}
          <SectionHeader>Sesión de hoy</SectionHeader>

          {loading ? (
            <Text className="font-sans text-sm text-muted">Cargando…</Text>
          ) : today.kind === 'workout' ? (
            <TodayWorkoutCard
              routine={today.routine}
              catalogById={catalogById}
              activeWorkout={activeWorkout !== null}
              onStart={() => {
                const exercises = buildWorkoutExercises(today.routine, catalogById);
                startWorkout({
                  routineId: today.routine.id,
                  routineName: today.routine.name,
                  // Si tuviéramos "Día 2/5" de un programa lo metemos aquí.
                  // De momento usamos un subtítulo neutro.
                  routineSubtitle: null,
                  exercises,
                }).catch((err) => console.error('[home] startWorkout error:', err));
              }}
              onFinishDev={() => {
                finishWorkout().catch((err) => console.error('[home] finishWorkout error:', err));
              }}
            />
          ) : today.kind === 'rest' ? (
            <RestDayCard />
          ) : (
            <FreeDayBlock onPlan={() => router.push('/routines')} />
          )}
        </View>
      </ScrollView>

      <InfoModal
        visible={radarInfoOpen}
        title="Tu balance muscular"
        message="El radar mide cómo de equilibrado entrenas en los últimos 14 días. Cuanto más entrenes, mejor te conoce."
        onClose={() => setRadarInfoOpen(false)}
      />
    </View>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

// Adapter de Routine + catálogo → la forma que espera el WorkoutSessionContext.
// Usa `StartWorkoutExercise` (sin status/currentSet/sets) — el contexto inicializa
// sets[] vacíos y recomputa status/currentSet automáticamente.
function buildWorkoutExercises(
  routine: Routine,
  catalogById: Map<string, Exercise>,
): StartWorkoutExercise[] {
  return routine.exercises
    .sort((a, b) => a.position - b.position)
    .map((re): StartWorkoutExercise => {
      const ex = catalogById.get(re.exerciseId);
      const repsLabel =
        re.targetRepsMin === re.targetRepsMax
          ? `${re.targetRepsMin}`
          : `${re.targetRepsMin}-${re.targetRepsMax}`;
      const primaryMuscle = ex?.muscleGroups[0]?.group ?? 'general';
      return {
        id: re.exerciseId,
        name: ex?.name ?? 'Ejercicio',
        muscleGroup: primaryMuscle.charAt(0).toUpperCase() + primaryMuscle.slice(1),
        targetSets: re.targetSets,
        targetReps: repsLabel,
      };
    });
}

/* ──────────────────────────────────────────────────────────────────────── */

function TodayWorkoutCard({
  routine,
  catalogById,
  activeWorkout,
  onStart,
  onFinishDev,
}: {
  routine: Routine;
  catalogById: Map<string, Exercise>;
  activeWorkout: boolean;
  onStart: () => void;
  onFinishDev: () => void;
}) {
  // Meta del card: grupos musculares (deducidos del catálogo), nº de ejercicios
  // y nº total de series. Se ve algo como "Espalda · Bíceps · 6 ej · 22 series".
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
          // Botón dev: cierra el entreno activo. Solo visible mientras el
          // workouts/ slice real no exista; entonces la finalización vive
          // dentro del workout sheet.
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

/* ──────────────────────────────────────────────────────────────────────── */

function RestDayCard() {
  return (
    <Card>
      <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
        Descanso planificado
      </Text>
      <Text className="mt-2 font-sans-black text-3xl tracking-[-0.5px] text-foreground">
        Hoy toca recuperar
      </Text>
      <Text className="mt-2 font-sans text-sm leading-5 text-muted">
        Subir de masa = comer. Apunta a 1.8 g de proteína por kg de peso hoy.
      </Text>
    </Card>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function FreeDayBlock({ onPlan }: { onPlan: () => void }) {
  // Sin Card a propósito: bloque plano, low-energy. Sin entreno planificado
  // no queremos que la pantalla grite; solo ofrecemos el camino para programar.
  return (
    <View className="py-1">
      <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">Hoy</Text>
      <Text className="mt-2 font-sans-bold text-lg text-foreground">Sin nada programado</Text>
      <Pressable
        accessibilityRole="link"
        onPress={onPlan}
        className="mt-2 self-start active:opacity-70"
        hitSlop={8}
      >
        <Text className="font-sans-bold text-sm text-primary">+ Programar este día</Text>
      </Pressable>
    </View>
  );
}
