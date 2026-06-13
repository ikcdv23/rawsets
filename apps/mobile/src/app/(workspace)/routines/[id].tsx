import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { useRepos } from '@/db/repo-provider';
import type { Exercise } from '@/features/exercises/domain/exercise';
import { ExercisePickerModal } from '@/features/exercises/ui/components/exercise-picker-modal';
import { listExercises } from '@/features/exercises/use-cases/list-exercises';
import type { Routine, RoutineExercise } from '@/features/routines/domain/routine';
import { RoutineActionsSheet } from '@/features/routines/ui/components/routine-actions-sheet';
import { RoutineExerciseEditModal } from '@/features/routines/ui/components/routine-exercise-edit-modal';
import { RoutineExerciseRow } from '@/features/routines/ui/components/routine-exercise-row';
import { RoutineHeroCard } from '@/features/routines/ui/components/routine-hero-card';
import { RoutineNameModal } from '@/features/routines/ui/components/routine-name-modal';
import { RoutineStatTile } from '@/features/routines/ui/components/routine-stat-tile';
import { addExercisesToRoutine } from '@/features/routines/use-cases/add-exercises-to-routine';
import { deleteRoutine } from '@/features/routines/use-cases/delete-routine';
import { moveExerciseInRoutine } from '@/features/routines/use-cases/move-exercise';
import { removeExerciseFromRoutine } from '@/features/routines/use-cases/remove-exercise-from-routine';
import { renameRoutine } from '@/features/routines/use-cases/rename-routine';
import { updateRoutineExercise } from '@/features/routines/use-cases/update-routine-exercise';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MoreVertical, Plus } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

// Pantalla detalle de rutina — composición cross-slice.
//
// Modos:
//   normal     → tap row = abrir editor; "Reordenar" en el eyebrow para entrar al otro modo.
//   reordenar  → cada row muestra ▲/▼ inline para mover. El eyebrow pasa a "Listo".
//
// Tres taps de gate para borrar: 3-dot → "Borrar" → confirmación.
const SECONDS_PER_SET_HEURISTIC = 180;

export default function RoutineDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { routine: routineRepo, exercise: exerciseRepo } = useRepos();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [editing, setEditing] = useState<RoutineExercise | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);

  const reload = useCallback(async () => {
    if (!id) return;
    try {
      const [rRes, catRes] = await Promise.all([
        routineRepo.findById(id),
        listExercises(exerciseRepo),
      ]);
      if (rRes.ok) setRoutine(rRes.value);
      if (catRes.ok) setCatalog(catRes.value);

      if (!rRes.ok) console.error('[routine-detail] findById error:', rRes.error);
      if (!catRes.ok) console.error('[routine-detail] listExercises error:', catRes.error);
    } catch (err) {
      console.error('[routine-detail] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [id, routineRepo, exerciseRepo]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="font-sans text-sm text-muted">Cargando…</Text>
      </View>
    );
  }

  if (!routine) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="font-sans-bold text-foreground">Rutina no encontrada</Text>
        <View className="mt-4">
          <Button variant="secondary" onPress={() => router.back()}>
            Volver
          </Button>
        </View>
      </View>
    );
  }

  const catalogById = new Map(catalog.map((e) => [e.id, e]));

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
  const estimatedMinutes =
    totalSets > 0 ? Math.round((totalSets * SECONDS_PER_SET_HEURISTIC) / 60) : null;

  const editingExerciseName = editing
    ? (catalogById.get(editing.exerciseId)?.name ?? 'Ejercicio')
    : '';

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-4 px-6 pb-32 pt-16">
          {/* Header — back + 3-dot menu */}
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Volver"
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface active:opacity-70"
            >
              <ChevronLeft color="#FAFAFA" size={20} strokeWidth={2.4} />
            </Pressable>
            <Pressable
              onPress={() => setShowActions(true)}
              accessibilityRole="button"
              accessibilityLabel="Acciones de la rutina"
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface active:opacity-70"
            >
              <MoreVertical color="#8A8A8A" size={18} strokeWidth={2.2} />
            </Pressable>
          </View>

          <RoutineHeroCard
            name={routine.name}
            muscleSummary={muscleSummary}
            exerciseCount={routine.exercises.length}
            estimatedMinutes={estimatedMinutes}
          />

          <View className="flex-row gap-2.5">
            <RoutineStatTile label="Series" value={totalSets > 0 ? String(totalSets) : '—'} />
            <RoutineStatTile label="Frecuencia" value="—" superscript="/sem" />
            <RoutineStatTile label="Último" value="—" />
          </View>

          {/* Eyebrow + toggle de modo reordenar */}
          <View className="mt-2 flex-row items-baseline justify-between">
            <Text className="font-sans-black text-[10px] uppercase tracking-[1.8px] text-muted">
              Ejercicios
            </Text>
            {routine.exercises.length > 1 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  reorderMode ? 'Salir de modo reordenar' : 'Reordenar ejercicios'
                }
                onPress={() => setReorderMode((v) => !v)}
                hitSlop={6}
                className="active:opacity-60"
              >
                <Text
                  className={[
                    'font-sans-black text-[10px] uppercase tracking-[1.8px]',
                    reorderMode ? 'text-primary' : 'text-muted-dim',
                  ].join(' ')}
                >
                  {reorderMode ? 'Listo' : 'Reordenar'}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {routine.exercises.length === 0 ? (
            <View
              className="overflow-hidden rounded-[20px] border border-border p-5"
              style={{ backgroundColor: '#141414' }}
            >
              <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
                Vacío
              </Text>
              <Text className="mt-2 font-sans-black text-xl text-foreground">
                Aún no hay ejercicios
              </Text>
              <Text className="mt-2 font-sans text-sm leading-5 text-muted">
                Pulsa "+ Añadir" abajo para escogerlos del catálogo.
              </Text>
            </View>
          ) : (
            routine.exercises.map((re, idx) => {
              const exercise = catalogById.get(re.exerciseId);
              const isFirst = idx === 0;
              const isLast = idx === routine.exercises.length - 1;
              return (
                <RoutineExerciseRow
                  key={re.exerciseId}
                  re={re}
                  position={idx + 1}
                  name={exercise?.name ?? '— eliminado del catálogo'}
                  muscleSummary={exercise?.muscleGroups.map((mg) => mg.group).join(' · ') ?? ''}
                  reorderMode={reorderMode}
                  canMoveUp={!isFirst}
                  canMoveDown={!isLast}
                  onPress={() => setEditing(re)}
                  onMoveUp={async () => {
                    const res = await moveExerciseInRoutine(
                      routineRepo,
                      routine.id,
                      re.exerciseId,
                      'up',
                    );
                    if (res.ok) await reload();
                    else console.error('[routine-detail] moveUp error:', res.error);
                  }}
                  onMoveDown={async () => {
                    const res = await moveExerciseInRoutine(
                      routineRepo,
                      routine.id,
                      re.exerciseId,
                      'down',
                    );
                    if (res.ok) await reload();
                    else console.error('[routine-detail] moveDown error:', res.error);
                  }}
                />
              );
            })
          )}

          {/* "+ Añadir ejercicio" oculto en modo reorder para no distraer. */}
          {!reorderMode ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Añadir ejercicio"
              onPress={() => setShowPicker(true)}
              className="mt-1 flex-row items-center justify-center gap-3 rounded-[16px] border border-dashed border-border-strong py-4 active:opacity-70"
            >
              <View
                className="h-7 w-7 items-center justify-center rounded-[8px] border border-border"
                style={{ backgroundColor: '#141414' }}
              >
                <Plus color="#FAFAFA" size={14} strokeWidth={2.6} />
              </View>
              <Text className="font-sans-black text-[12px] uppercase tracking-[1.5px] text-foreground">
                Añadir ejercicio
              </Text>
            </Pressable>
          ) : null}

          {/* CTA principal: empezar entreno. Disabled en modo reorder y si rutina vacía. */}
          {!reorderMode ? (
            <View className="mt-4">
              <Button
                onPress={() => {
                  console.log('[routine-detail] start workout — workouts/ slice pendiente');
                }}
                disabled={routine.exercises.length === 0}
              >
                Empezar entreno
              </Button>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <ExercisePickerModal
        visible={showPicker}
        catalog={catalog}
        alreadyAddedIds={new Set(routine.exercises.map((e) => e.exerciseId))}
        onClose={() => setShowPicker(false)}
        onConfirm={async (ids) => {
          const res = await addExercisesToRoutine(
            routineRepo,
            routine.id,
            ids.map((exerciseId) => ({ exerciseId })),
          );
          if (res.ok) {
            await reload();
            setShowPicker(false);
          } else {
            console.error('[routine-detail] addExercises error:', res.error);
          }
        }}
      />

      {editing ? (
        <RoutineExerciseEditModal
          visible={true}
          exerciseName={editingExerciseName}
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            const res = await updateRoutineExercise(
              routineRepo,
              routine.id,
              editing.exerciseId,
              patch,
            );
            if (res.ok) {
              await reload();
              setEditing(null);
            } else {
              console.error('[routine-detail] updateExercise error:', res.error);
            }
          }}
          onRemove={async () => {
            const res = await removeExerciseFromRoutine(routineRepo, routine.id, editing.exerciseId);
            if (res.ok) {
              await reload();
              setEditing(null);
            } else {
              console.error('[routine-detail] removeExercise error:', res.error);
            }
          }}
        />
      ) : null}

      <RoutineActionsSheet
        visible={showActions}
        onClose={() => setShowActions(false)}
        onAskRename={() => {
          setShowActions(false);
          setTimeout(() => setShowRename(true), 200);
        }}
        onAskDelete={() => {
          setShowActions(false);
          setTimeout(() => setConfirmDelete(true), 200);
        }}
      />

      <RoutineNameModal
        visible={showRename}
        title="Renombrar rutina"
        question="¿Nuevo nombre?"
        confirmLabel="Guardar"
        initialName={routine.name}
        onClose={() => setShowRename(false)}
        onConfirm={async (newName) => {
          const res = await renameRoutine(routineRepo, routine.id, newName);
          if (res.ok) {
            setShowRename(false);
            await reload();
          } else {
            console.error('[routine-detail] renameRoutine error:', res.error);
          }
        }}
      />

      <ConfirmationModal
        visible={confirmDelete}
        situation="trash"
        title="¿Borrar rutina?"
        message={`Se eliminará "${routine.name}" y sus ${routine.exercises.length} ejercicios planificados. Los entrenos ya registrados con esta rutina NO se borran.`}
        confirmLabel="Borrar"
        cancelLabel="Cancelar"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          const res = await deleteRoutine(routineRepo, routine.id);
          if (res.ok) {
            router.back();
          } else {
            console.error('[routine-detail] deleteRoutine error:', res.error);
          }
        }}
      />
    </View>
  );
}
