import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import type { RoutineExercise } from '../../domain/routine';

// Modal de edición de los targets de un ejercicio dentro de una rutina.
//
// Patrón: el modal recibe el ejercicio actual + tres callbacks (save / remove /
// close). Estado local — el parent decide qué hacer al guardar (call use case
// + reload). Mantiene el modal libre de Drizzle/repo.
//
// "Quitar de la rutina" vive DENTRO del modal en vez de en la row. Razón:
//  - Evita el bug de `<button>` anidados en web (row Pressable + X Pressable).
//  - Punto único de entrada (tap → modal) → UX más predecible.
//  - El destructivo está protegido detrás de un tap previo, menos accidentes.
export type RoutineExerciseEditModalProps = {
  visible: boolean;
  exerciseName: string;
  initial: RoutineExercise;
  onClose: () => void;
  onSave: (patch: {
    targetSets: number;
    targetRepsMin: number;
    targetRepsMax: number;
    targetWeight: number | null;
    notes: string | null;
  }) => Promise<void>;
  onRemove: () => Promise<void>;
};

export function RoutineExerciseEditModal({
  visible,
  exerciseName,
  initial,
  onClose,
  onSave,
  onRemove,
}: RoutineExerciseEditModalProps) {
  const [sets, setSets] = useState(initial.targetSets);
  const [repsMin, setRepsMin] = useState(initial.targetRepsMin);
  const [repsMax, setRepsMax] = useState(initial.targetRepsMax);
  const [weight, setWeight] = useState<string>(
    initial.targetWeight !== null ? String(initial.targetWeight) : '',
  );
  const [notes, setNotes] = useState<string>(initial.notes ?? '');
  const [submitting, setSubmitting] = useState(false);

  // Resetear cuando cambia el ejercicio target (modal se reabre con otro).
  useEffect(() => {
    setSets(initial.targetSets);
    setRepsMin(initial.targetRepsMin);
    setRepsMax(initial.targetRepsMax);
    setWeight(initial.targetWeight !== null ? String(initial.targetWeight) : '');
    setNotes(initial.notes ?? '');
  }, [initial]);

  const handleSave = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const parsedWeight =
        weight.trim() === '' ? null : Number.parseFloat(weight.replace(',', '.'));
      await onSave({
        targetSets: sets,
        targetRepsMin: repsMin,
        targetRepsMax: Math.max(repsMin, repsMax),
        targetWeight: parsedWeight !== null && !Number.isNaN(parsedWeight) ? parsedWeight : null,
        notes: notes.trim() === '' ? null : notes.trim(),
      });
    } catch (err) {
      console.error('[edit-exercise] save error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onRemove();
    } catch (err) {
      console.error('[edit-exercise] remove error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center bg-black/55 px-6">
        <Pressable
          onPress={() => {}}
          style={{ backgroundColor: '#141414' }}
          className="w-full max-w-[400px] rounded-[24px] border border-border-strong p-6"
        >
          <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
            Editar
          </Text>
          <Text
            className="mt-1 font-sans-black text-xl tracking-[-0.3px] text-foreground"
            numberOfLines={1}
          >
            {exerciseName}
          </Text>

          {/* Series */}
          <View className="mt-5">
            <Text className="font-sans-bold text-[11px] uppercase tracking-[1.3px] text-muted">
              Series
            </Text>
            <Stepper value={sets} min={1} max={20} onChange={setSets} />
          </View>

          {/* Rango de reps */}
          <View className="mt-4">
            <Text className="font-sans-bold text-[11px] uppercase tracking-[1.3px] text-muted">
              Reps
            </Text>
            <View className="mt-2 flex-row items-center gap-3">
              <View className="flex-1">
                <Text className="font-sans text-[10px] text-muted-dim">Min</Text>
                <Stepper value={repsMin} min={1} max={50} onChange={setRepsMin} />
              </View>
              <View className="flex-1">
                <Text className="font-sans text-[10px] text-muted-dim">Max</Text>
                <Stepper value={repsMax} min={1} max={50} onChange={setRepsMax} />
              </View>
            </View>
            <Text className="mt-1 font-sans text-[10px] text-muted-dim">
              Si min = max, se mostrará como "{repsMin} reps". Si difieren, "{repsMin}–{repsMax}".
            </Text>
          </View>

          {/* Peso opcional */}
          <View className="mt-4">
            <Text className="font-sans-bold text-[11px] uppercase tracking-[1.3px] text-muted">
              Peso objetivo (kg) · opcional
            </Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              placeholder="vacío = libre"
              placeholderTextColor="#4A4A4A"
              keyboardType="decimal-pad"
              returnKeyType="done"
              className="mt-2 rounded-xl border border-border bg-background px-4 py-2.5 font-sans text-foreground"
              style={{ fontSize: 15 }}
            />
          </View>

          {/* Notas */}
          <View className="mt-4">
            <Text className="font-sans-bold text-[11px] uppercase tracking-[1.3px] text-muted">
              Notas · opcional
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder='Ej. "RIR 2", "cadencia 3-1-1"'
              placeholderTextColor="#4A4A4A"
              multiline
              numberOfLines={2}
              className="mt-2 rounded-xl border border-border bg-background px-4 py-2.5 font-sans text-foreground"
              style={{ fontSize: 14, minHeight: 56 }}
            />
          </View>

          {/* Acciones */}
          <View className="mt-6 gap-3">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button variant="secondary" onPress={onClose} disabled={submitting}>
                  Cancelar
                </Button>
              </View>
              <View className="flex-1">
                <Button onPress={handleSave} disabled={submitting}>
                  Guardar
                </Button>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={handleRemove}
              disabled={submitting}
              className="self-center py-2 active:opacity-60"
              hitSlop={6}
            >
              <Text className="font-sans-bold text-[12px] uppercase tracking-[1.3px] text-destructive">
                Quitar de la rutina
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

// Stepper sencillo: [-] [valor] [+]. Botones deshabilitados en los límites.
// Lo dejo local porque solo se usa aquí — si aparece en otra pantalla, fuera.
function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <View className="mt-1 flex-row items-center gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Disminuir"
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
        hitSlop={6}
        className={[
          'h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-surface',
          value <= min ? 'opacity-40' : 'active:opacity-70',
        ].join(' ')}
      >
        <Minus color="#FAFAFA" size={16} strokeWidth={2.4} />
      </Pressable>
      <Text
        className="min-w-[36px] text-center font-sans-black text-[20px] text-foreground"
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Aumentar"
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + 1))}
        hitSlop={6}
        className={[
          'h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-surface',
          value >= max ? 'opacity-40' : 'active:opacity-70',
        ].join(' ')}
      >
        <Plus color="#FAFAFA" size={16} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}
