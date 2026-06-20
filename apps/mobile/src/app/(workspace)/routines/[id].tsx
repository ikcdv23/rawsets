import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { ExercisePickerModal } from '@/features/exercises/ui/components/exercise-picker-modal';
import { RoutineActionsSheet } from '@/features/routines/ui/components/routine-actions-sheet';
import { RoutineExerciseEditModal } from '@/features/routines/ui/components/routine-exercise-edit-modal';
import { RoutineExerciseRow } from '@/features/routines/ui/components/routine-exercise-row';
import { RoutineHeroCard } from '@/features/routines/ui/components/routine-hero-card';
import { RoutineNameModal } from '@/features/routines/ui/components/routine-name-modal';
import { RoutineStatTile } from '@/features/routines/ui/components/routine-stat-tile';
import { useRoutineDetail } from '@/features/routines/ui/hooks/use-routine-detail';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, MoreVertical, Plus } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, ui, actions } = useRoutineDetail(id);
  const {
    routine,
    loading,
    reorderMode,
    muscleSummary,
    totalSets,
    estimatedMinutes,
    catalog,
    catalogById,
    editingExercise,
    editingExerciseName,
  } = state;

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
          <Button variant="secondary" onPress={actions.goBack}>
            Volver
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-4 px-6 pb-32 pt-16">
          {/* Header — back + 3-dot menu */}
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={actions.goBack}
              accessibilityRole="button"
              accessibilityLabel="Volver"
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface active:opacity-70"
            >
              <ChevronLeft color="#FAFAFA" size={20} strokeWidth={2.4} />
            </Pressable>
            <Pressable
              onPress={ui.openActionsSheet}
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
                onPress={ui.toggleReorderMode}
                hitSlop={6}
                className="active:opacity-60"
              >
                <Text
                  className={[
                    'font-sans-black text-[10px] uppercase tracking-[1.8px]',
                    reorderMode ? 'text-primary' : 'text-primary',
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
                  onPress={() => ui.startEditingExercise(re)}
                  onMoveUp={() => actions.moveExercise(re.exerciseId, 'up')}
                  onMoveDown={() => actions.moveExercise(re.exerciseId, 'down')}
                />
              );
            })
          )}

          {/* "+ Añadir ejercicio" oculto en modo reorder para no distraer. */}
          {!reorderMode ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Añadir ejercicio"
              onPress={ui.openPicker}
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
              <Button onPress={actions.startWorkout} disabled={routine.exercises.length === 0}>
                Empezar entreno
              </Button>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <ExercisePickerModal
        visible={ui.isPickerVisible}
        catalog={catalog}
        alreadyAddedIds={new Set(routine.exercises.map((e) => e.exerciseId))}
        onClose={ui.closePicker}
        onConfirm={actions.addExercises}
      />

      {editingExercise ? (
        <RoutineExerciseEditModal
          visible={ui.isEditingModalVisible}
          exerciseName={editingExerciseName}
          initial={editingExercise}
          onClose={ui.stopEditingExercise}
          onSave={actions.updateExercise}
          onRemove={actions.removeExercise}
        />
      ) : null}

      <RoutineActionsSheet
        visible={ui.isActionsSheetVisible}
        onClose={ui.closeActionsSheet}
        onAskRename={ui.openRenameModal}
        onAskDelete={ui.openDeleteConfirmation}
      />

      <RoutineNameModal
        visible={ui.isRenameModalVisible}
        title="Renombrar rutina"
        question="¿Nuevo nombre?"
        confirmLabel="Guardar"
        initialName={routine.name}
        onClose={ui.closeRenameModal}
        onConfirm={actions.renameRoutine}
      />

      <ConfirmationModal
        visible={ui.isDeleteConfirmationVisible}
        situation="trash"
        title="¿Borrar rutina?"
        message={`Se eliminará "${routine.name}" y sus ${routine.exercises.length} ejercicios planificados. Los entrenos ya registrados con esta rutina NO se borran.`}
        confirmLabel="Borrar"
        cancelLabel="Cancelar"
        onCancel={ui.closeDeleteConfirmation}
        onConfirm={actions.deleteRoutine}
      />
    </View>
  );
}
