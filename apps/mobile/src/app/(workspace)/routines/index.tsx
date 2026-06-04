import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { AvatarIcon } from '@/components/ui/profile/avatar-icon';
import { SectionHeader } from '@/components/ui/section-header';
import { useDb } from '@/db/db-provider';
import { DrizzleSqliteExerciseRepo } from '@/features/exercises/adapters/drizzle-sqlite-exercise-repo';
import type { Exercise } from '@/features/exercises/domain/exercise';
import { listExercises } from '@/features/exercises/use-cases/list-exercises';
import { DrizzleSqliteRoutineRepo } from '@/features/routines/adapters/drizzle-sqlite-routine-repo';
import type { Routine } from '@/features/routines/domain/routine';
import { CreateRoutineDashedButton } from '@/features/routines/ui/components/create-routine-dashed-button';
import { CreateRoutineModal } from '@/features/routines/ui/components/create-routine-modal';
import { RoutineCard } from '@/features/routines/ui/components/routine-card';
import { RoutinesSelectionBar } from '@/features/routines/ui/components/routines-selection-bar';
import { createRoutine } from '@/features/routines/use-cases/create-routine';
import { deleteRoutine } from '@/features/routines/use-cases/delete-routine';
import { listRoutines } from '@/features/routines/use-cases/list-routines';
import { DrizzleSqliteScheduledSessionRepo } from '@/features/scheduling/adapters/drizzle-sqlite-scheduled-session-repo';
import { addMonths, startOfMonth } from '@/features/scheduling/domain/dates';
import type { ScheduledSession } from '@/features/scheduling/domain/scheduled-session';
import { AssignDaySheet } from '@/features/scheduling/ui/components/assign-day-sheet';
import { CalendarMonthCard } from '@/features/scheduling/ui/components/calendar-month-card';
import { assignRoutineToDay } from '@/features/scheduling/use-cases/assign-routine-to-day';
import { listScheduledInRange } from '@/features/scheduling/use-cases/list-scheduled-in-range';
import { markRestDay } from '@/features/scheduling/use-cases/mark-rest-day';
import { unscheduleDay } from '@/features/scheduling/use-cases/unschedule-day';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

// Pantalla Rutinas. Dos modos:
//
//   Normal      → calendario + lista. Tap card abre detalle. Long-press entra
//                 en selección. Tap día del calendario abre sheet de asignar.
//   Selección   → tap toggle marca/desmarca. Header reemplazado por barra
//                 cancel + N seleccionadas + borrar (con confirmation modal).
//
// El rango del calendario que cargamos es el del MES VISIBLE expandido a
// 6 semanas — basta para pintar la grid. Si el usuario navega mes, hacemos
// re-fetch.
export default function RoutinesScreen() {
  const { db, sqlite } = useDb();
  const router = useRouter();
  const routineRepo = useMemo(() => new DrizzleSqliteRoutineRepo(db, sqlite), [db, sqlite]);
  const exerciseRepo = useMemo(() => new DrizzleSqliteExerciseRepo(db, sqlite), [db, sqlite]);
  const scheduleRepo = useMemo(
    () => new DrizzleSqliteScheduledSessionRepo(db, sqlite),
    [db, sqlite],
  );

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [_catalog, setCatalog] = useState<Exercise[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Mes ancla del calendario — primer día del mes visible.
  const [monthAnchor, setMonthAnchor] = useState<Date>(() => startOfMonth(new Date()));
  // Día seleccionado para abrir sheet de asignar.
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Estado de selección múltiple de rutinas (long-press).
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  const reload = useCallback(async () => {
    try {
      const from = addMonths(monthAnchor, -1);
      const to = addMonths(monthAnchor, 2);
      const [rs, cat, sch] = await Promise.all([
        listRoutines(routineRepo),
        listExercises(exerciseRepo),
        listScheduledInRange(scheduleRepo, from, to),
      ]);
      setRoutines(rs);
      setCatalog(cat);
      setScheduled(sch);
    } catch (err) {
      console.error('[routines] list error:', err);
    } finally {
      setLoading(false);
    }
  }, [routineRepo, exerciseRepo, scheduleRepo, monthAnchor]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const catalogById = useMemo(() => new Map(_catalog.map((e) => [e.id, e])), [_catalog]);

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleLongPress = (id: string) => {
    setSelectionMode(true);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePress = (id: string) => {
    if (selectionMode) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        if (next.size === 0) setSelectionMode(false);
        return next;
      });
    } else {
      router.push(`/routines/${id}`);
    }
  };

  const performBulkDelete = async () => {
    setConfirmDelete(false);
    const ids = Array.from(selectedIds);
    await Promise.allSettled(ids.map((id) => deleteRoutine(routineRepo, id)));
    exitSelection();
    await reload();
  };

  // Lookup de la sesión asignada al día seleccionado (si la hay).
  const currentSessionForDay = useMemo(() => {
    if (!selectedDay) return null;
    const ts = selectedDay.getTime();
    return scheduled.find((s) => Math.abs(s.date.getTime() - ts) < 86_400_000) ?? null;
  }, [selectedDay, scheduled]);

  return (
    <View className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-3 px-6 pb-32 pt-8">
          {selectionMode ? (
            <RoutinesSelectionBar
              count={selectedIds.size}
              onCancel={exitSelection}
              onDelete={() => setConfirmDelete(true)}
            />
          ) : (
            <View className="flex-row items-center justify-between">
              <Text className="font-sans-black text-2xl tracking-[-0.5px] text-foreground">
                Rutinas<Text className="text-primary">.</Text>
              </Text>
              <AvatarIcon />
            </View>
          )}

          {/* Calendario real (sustituye el placeholder que tuvimos) */}
          <SectionHeader>Balance muscular</SectionHeader>
          {!selectionMode ? (
            <CalendarMonthCard
              monthAnchor={monthAnchor}
              scheduled={scheduled}
              routines={routines}
              onMonthChange={setMonthAnchor}
              onDayPress={setSelectedDay}
            />
          ) : null}

          <View className="mt-2 flex-row items-baseline justify-between">
            <Text className="font-sans-black text-[10px] uppercase tracking-[1.8px] text-muted">
              Guardadas
            </Text>
            {routines.length > 0 && !selectionMode ? (
              <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted-dim">
                {routines.length} {routines.length === 1 ? 'rutina' : 'rutinas'}
              </Text>
            ) : null}
          </View>

          {loading ? (
            <Text className="font-sans text-sm text-muted">Cargando…</Text>
          ) : routines.length === 0 ? (
            <EmptyState onCreate={() => setShowCreate(true)} />
          ) : (
            <>
              {routines.map((r) => (
                <RoutineCard
                  key={r.id}
                  routine={r}
                  catalogById={catalogById}
                  selected={selectedIds.has(r.id)}
                  onPress={() => handlePress(r.id)}
                  onLongPress={() => handleLongPress(r.id)}
                />
              ))}
              {!selectionMode ? (
                <CreateRoutineDashedButton onPress={() => setShowCreate(true)} />
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      <CreateRoutineModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={async (name) => {
          await createRoutine(routineRepo, { name }, () => crypto.randomUUID());
          setShowCreate(false);
          reload();
        }}
      />

      <ConfirmationModal
        visible={confirmDelete}
        situation="trash"
        title={selectedIds.size === 1 ? '¿Borrar rutina?' : `¿Borrar ${selectedIds.size} rutinas?`}
        message={
          selectedIds.size === 1
            ? 'Se eliminará la rutina y sus ejercicios planificados. Los entrenos ya registrados con ella NO se borran.'
            : `Se eliminarán ${selectedIds.size} rutinas y sus ejercicios planificados. Los entrenos ya registrados NO se borran.`
        }
        confirmLabel="Borrar"
        cancelLabel="Cancelar"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={performBulkDelete}
      />

      <AssignDaySheet
        visible={selectedDay !== null}
        date={selectedDay}
        routines={routines}
        currentSession={currentSessionForDay}
        onClose={() => setSelectedDay(null)}
        onAssignRoutine={async (routineId) => {
          if (!selectedDay) return;
          await assignRoutineToDay(scheduleRepo, selectedDay, routineId, () => crypto.randomUUID());
          setSelectedDay(null);
          await reload();
        }}
        onMarkRest={async () => {
          if (!selectedDay) return;
          await markRestDay(scheduleRepo, selectedDay, () => crypto.randomUUID());
          setSelectedDay(null);
          await reload();
        }}
        onUnschedule={async () => {
          if (!selectedDay) return;
          await unscheduleDay(scheduleRepo, selectedDay);
          setSelectedDay(null);
          await reload();
        }}
        onCreateRoutine={() => {
          setSelectedDay(null);
          setShowCreate(true);
        }}
      />
    </View>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <View
      className="overflow-hidden rounded-[20px] border border-border p-5"
      style={{ backgroundColor: '#141414' }}
    >
      <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
        Sin rutinas aún
      </Text>
      <Text className="mt-2 font-sans-black text-2xl tracking-[-0.5px] text-foreground">
        Tu plan empieza aquí
      </Text>
      <Text className="mt-2 font-sans text-sm leading-5 text-muted">
        Crea una rutina — una sesión nombrada como "Tirón A". Después le añades ejercicios y la
        programas en el calendario.
      </Text>
      <View className="mt-4">
        <Button onPress={onCreate}>+ Crear primera rutina</Button>
      </View>
    </View>
  );
}
