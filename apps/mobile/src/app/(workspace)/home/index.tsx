import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InfoModal } from '@/components/ui/info-modal';
import { AvatarIcon } from '@/components/ui/profile/avatar-icon';
import { type RadarAxis, RadarChart } from '@/components/ui/radar-chart';
import { SectionHeader } from '@/components/ui/section-header';
import { Stat } from '@/components/ui/stat';
import { useDb } from '@/db/db-provider';
import { DrizzleSqliteExerciseRepo } from '@/features/exercises/adapters/drizzle-sqlite-exercise-repo';
import type { Exercise } from '@/features/exercises/domain/exercise';
import { listExercises } from '@/features/exercises/use-cases/list-exercises';
import { DrizzleSqliteRoutineRepo } from '@/features/routines/adapters/drizzle-sqlite-routine-repo';
import type { Routine } from '@/features/routines/domain/routine';
import { DrizzleSqliteScheduledSessionRepo } from '@/features/scheduling/adapters/drizzle-sqlite-scheduled-session-repo';
import { addDays, startOfDay } from '@/features/scheduling/domain/dates';
import type { ScheduledSession } from '@/features/scheduling/domain/scheduled-session';
import { listScheduledInRange } from '@/features/scheduling/use-cases/list-scheduled-in-range';
import {
  type WorkoutExercise,
  useWorkoutSession,
} from '@/features/workouts/ui/contexts/workout-session-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Info } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

// Toggle temporal del histórico. Cuando exista el slice workouts/, se sustituye
// por una query real (`countWorkoutsInRange` o similar). Mientras tanto, el
// radar y los KPIs siguen en modo "esperando primer entreno".
const MOCK_HAS_HISTORY: boolean = false;

// Ejes del radar — placeholder hasta que existan datos de workouts.
const RADAR_DATA: RadarAxis[] = [
  { label: 'Pecho', value: 92 },
  { label: 'Brazos', value: 68 },
  { label: 'Piernas', value: 76 },
  { label: 'Core', value: 55 },
  { label: 'Espalda', value: 38, flagged: true },
  { label: 'Hombros', value: 71 },
];

const RADAR_EMPTY: RadarAxis[] = RADAR_DATA.map((a) => ({ label: a.label, value: 0 }));

// Tres estados de "Sesión de hoy", derivados de los datos reales:
//   workout → hay scheduled_session con routineId apuntando a una rutina viva
//   rest    → hay scheduled_session con routineId = null
//   free    → no hay scheduled_session para hoy
type TodayState = { kind: 'workout'; routine: Routine } | { kind: 'rest' } | { kind: 'free' };

export default function HomeScreen() {
  const router = useRouter();
  const { db, sqlite } = useDb();
  const routineRepo = useMemo(() => new DrizzleSqliteRoutineRepo(db, sqlite), [db, sqlite]);
  const exerciseRepo = useMemo(() => new DrizzleSqliteExerciseRepo(db, sqlite), [db, sqlite]);
  const scheduleRepo = useMemo(
    () => new DrizzleSqliteScheduledSessionRepo(db, sqlite),
    [db, sqlite],
  );

  const [radarInfoOpen, setRadarInfoOpen] = useState(false);
  const { activeWorkout, startWorkout, finishWorkout } = useWorkoutSession();

  const [todaySession, setTodaySession] = useState<ScheduledSession | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const today = startOfDay(new Date());
      const tomorrow = addDays(today, 1);
      // Las tres queries van en paralelo — son independientes.
      const [sch, rs, cat] = await Promise.all([
        listScheduledInRange(scheduleRepo, today, tomorrow),
        routineRepo.list(),
        listExercises(exerciseRepo),
      ]);
      setTodaySession(sch[0] ?? null);
      setRoutines(rs);
      setCatalog(cat);
    } catch (err) {
      console.error('[home] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [scheduleRepo, routineRepo, exerciseRepo]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  // Lookup rápido de ejercicios para enriquecer la rutina del día.
  const catalogById = useMemo(() => new Map(catalog.map((e) => [e.id, e])), [catalog]);
  const routinesById = useMemo(() => new Map(routines.map((r) => [r.id, r])), [routines]);

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
          <Card glow glowPosition="center" glowOpacity={0.16}>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="font-sans-bold text-foreground">Últimos 14 días</Text>
              {MOCK_HAS_HISTORY ? (
                <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-destructive">
                  Espalda baja
                </Text>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="¿Qué es el balance muscular?"
                  onPress={() => setRadarInfoOpen(true)}
                  className="active:opacity-60"
                  hitSlop={8}
                >
                  <Info color="#8A8A8A" size={18} strokeWidth={2.2} />
                </Pressable>
              )}
            </View>
            <RadarChart
              data={MOCK_HAS_HISTORY ? RADAR_DATA : RADAR_EMPTY}
              empty={!MOCK_HAS_HISTORY}
            />
            {!MOCK_HAS_HISTORY && (
              <Text className="mt-2 text-center font-sans text-[12px] text-muted">
                Tu radar despertará con tu primera sesión.
              </Text>
            )}
          </Card>

          {/* Resumen: 4 KPIs en grid 2x2. "—" cuando no hay histórico. */}
          <SectionHeader>Resumen</SectionHeader>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Stat
                label="Volumen sem"
                value={MOCK_HAS_HISTORY ? '12.4' : '—'}
                unit={MOCK_HAS_HISTORY ? 't' : undefined}
              />
            </View>
            <View className="flex-1">
              <Stat
                label="Sesiones"
                value={MOCK_HAS_HISTORY ? '4' : '—'}
                unit={MOCK_HAS_HISTORY ? '/5' : undefined}
              />
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Stat
                label="PRs · mes"
                value={MOCK_HAS_HISTORY ? '3' : '—'}
                tone={MOCK_HAS_HISTORY ? 'primary' : 'default'}
              />
            </View>
            <View className="flex-1">
              <Stat
                label="Grupos OK"
                value={MOCK_HAS_HISTORY ? '8' : '—'}
                unit={MOCK_HAS_HISTORY ? '/11' : undefined}
                tone={MOCK_HAS_HISTORY ? 'destructive' : 'default'}
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
                  routineName: today.routine.name,
                  // Si tuviéramos "Día 2/5" de un programa lo metemos aquí.
                  // De momento usamos un subtítulo neutro.
                  routineSubtitle: null,
                  exercises,
                });
              }}
              onFinishDev={finishWorkout}
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

// Adapter de Routine + catálogo → la forma `WorkoutExercise[]` que espera el
// WorkoutSessionContext. Local porque es traducción específica del Home; si
// más adelante hay otros consumidores que arrancan workouts (e.g. "empezar
// libre desde una rutina"), se sube a un helper.
function buildWorkoutExercises(
  routine: Routine,
  catalogById: Map<string, Exercise>,
): WorkoutExercise[] {
  return routine.exercises
    .sort((a, b) => a.position - b.position)
    .map((re, idx): WorkoutExercise => {
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
        // El primero arranca como "current" (toca este); el resto pending.
        status: idx === 0 ? 'current' : 'pending',
        currentSet: idx === 0 ? 1 : null,
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
