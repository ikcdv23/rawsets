import { Button } from '@/components/ui/button';
import { Check, Info, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { EQUIPMENT, type Equipment } from '../../domain/equipment';
import type { Exercise } from '../../domain/exercise';
import { MUSCLE_GROUPS, type MuscleGroup } from '../../domain/muscle-groups';
import { ExerciseDetailModal } from './exercise-detail-modal';

// Picker del catálogo con búsqueda + filtros + multi-select.
export type ExercisePickerModalProps = {
  visible: boolean;
  catalog: Exercise[];
  alreadyAddedIds: Set<string>;
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => Promise<void>;
};

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombro: 'Hombro',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  antebrazo: 'Antebrazo',
  cuadriceps: 'Cuádriceps',
  isquios: 'Isquios',
  gluteo: 'Glúteo',
  pantorrilla: 'Pantorrilla',
  core: 'Core',
};

const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barra: 'Barra',
  mancuerna: 'Mancuerna',
  'peso-corporal': 'Peso corporal',
  maquina: 'Máquina',
  polea: 'Polea',
  otro: 'Otro',
};

// Normaliza para búsqueda: quita tildes y baja a minúsculas.
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '');
}

export function ExercisePickerModal({
  visible,
  catalog,
  alreadyAddedIds,
  onClose,
  onConfirm,
}: ExercisePickerModalProps) {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [inspectingExercise, setInspectingExercise] = useState<Exercise | null>(null);

  // Reset al cerrar — fresh start en cada apertura.
  const resetAndClose = () => {
    setQuery('');
    setMuscle(null);
    setEquipment(null);
    setSelected(new Set());
    onClose();
  };

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return catalog.filter((ex) => {
      if (q && !normalize(ex.name).includes(q)) return false;
      if (muscle && !ex.muscleGroups.some((mg) => mg.group === muscle)) return false;
      if (equipment && ex.equipment !== equipment) return false;
      return true;
    });
  }, [catalog, query, muscle, equipment]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (submitting || selected.size === 0) return;
    setSubmitting(true);
    try {
      await onConfirm(Array.from(selected));
      // Reset local — el parent decide cerrar el modal.
      setQuery('');
      setMuscle(null);
      setEquipment(null);
      setSelected(new Set());
    } catch (err) {
      console.error('[exercise-picker] confirm error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
      <Pressable accessibilityLabel="Cerrar" onPress={resetAndClose} className="flex-1 bg-black/55">
        <Pressable
          onPress={() => {}}
          style={{ backgroundColor: '#0A0A0A' }}
          className="absolute bottom-0 left-0 right-0 h-[88%] rounded-t-[32px] border-t border-border-strong"
        >
          {/* Handle */}
          <View className="items-center pb-1 pt-2">
            <View className="h-1 w-10 rounded-full bg-border-strong" />
          </View>

          {/* Header */}
          <View className="border-b border-border px-6 pb-3 pt-2">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-sans-bold text-[10px] uppercase tracking-[1.8px] text-muted">
                  Catálogo
                </Text>
                <Text className="mt-1 font-sans-black text-2xl tracking-[-0.5px] text-foreground">
                  Añadir ejercicios
                </Text>
              </View>
              <Text className="font-sans-bold text-[11px] uppercase tracking-[1.3px] text-muted-dim">
                {filtered.length}/{catalog.length}
              </Text>
            </View>

            {/* Buscador */}
            <View
              className="mt-3 flex-row items-center gap-2 rounded-xl border border-border px-3 py-2"
              style={{ backgroundColor: '#141414' }}
            >
              <Search color="#8A8A8A" size={16} strokeWidth={2.2} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar ejercicio…"
                placeholderTextColor="#4A4A4A"
                className="flex-1 font-sans text-foreground"
                style={{ fontSize: 14 }}
                returnKeyType="search"
              />
              {query.length > 0 ? (
                <Pressable
                  onPress={() => setQuery('')}
                  accessibilityRole="button"
                  accessibilityLabel="Limpiar búsqueda"
                  hitSlop={6}
                >
                  <X color="#8A8A8A" size={16} strokeWidth={2.2} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Filtros */}
          <View className="px-6 pt-3">
            <Text className="font-sans-bold text-[9px] uppercase tracking-[1.4px] text-muted-dim">
              Grupo muscular
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, paddingVertical: 6 }}
            >
              <FilterChip label="Todos" active={muscle === null} onPress={() => setMuscle(null)} />
              {MUSCLE_GROUPS.map((mg) => (
                <FilterChip
                  key={mg}
                  label={MUSCLE_LABELS[mg]}
                  active={muscle === mg}
                  onPress={() => setMuscle(muscle === mg ? null : mg)}
                />
              ))}
            </ScrollView>

            <Text className="mt-1 font-sans-bold text-[9px] uppercase tracking-[1.4px] text-muted-dim">
              Equipo
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, paddingVertical: 6 }}
            >
              <FilterChip
                label="Todos"
                active={equipment === null}
                onPress={() => setEquipment(null)}
              />
              {EQUIPMENT.map((eq) => (
                <FilterChip
                  key={eq}
                  label={EQUIPMENT_LABELS[eq]}
                  active={equipment === eq}
                  onPress={() => setEquipment(equipment === eq ? null : eq)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Lista de ejercicios filtrados */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 18, paddingBottom: 24, gap: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {filtered.length === 0 ? (
              <Text className="mt-4 text-center font-sans text-sm text-muted">
                Ninguno coincide con esos filtros.
              </Text>
            ) : (
              filtered.map((ex) => {
                const isAdded = alreadyAddedIds.has(ex.id);
                const isSelected = selected.has(ex.id);
                const muscleSummary = ex.muscleGroups.map((mg) => mg.group).join(' · ');
                return (
                  <Pressable
                    key={ex.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected, disabled: isAdded }}
                    disabled={isAdded}
                    onPress={() => toggle(ex.id)}
                    style={{
                      backgroundColor: '#141414',
                      borderColor: isSelected ? '#A8E055' : '#1F1F1F',
                      borderWidth: 1,
                    }}
                    className={[
                      'flex-row items-center gap-3 rounded-[14px] px-4 py-3',
                      isAdded ? 'opacity-40' : 'active:opacity-70',
                    ].join(' ')}
                  >
                    {/* Indicador de selección */}
                    <View
                      className="h-6 w-6 items-center justify-center rounded-md"
                      style={{
                        backgroundColor: isSelected ? '#A8E055' : 'transparent',
                        borderWidth: 1,
                        borderColor: isSelected ? '#A8E055' : '#2A2A2A',
                      }}
                    >
                      {isSelected ? <Check color="#0A0A0A" size={14} strokeWidth={3} /> : null}
                    </View>

                    <View className="min-w-0 flex-1">
                      <Text
                        className="font-sans-bold text-[14px] tracking-[-0.05px] text-foreground"
                        numberOfLines={1}
                      >
                        {ex.name}
                      </Text>
                      <Text
                        className="mt-0.5 font-sans-medium text-[10px] uppercase tracking-[1.2px] text-muted"
                        numberOfLines={1}
                      >
                        {ex.equipment} · {muscleSummary}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-3">
                      {isAdded && (
                        <Text className="font-sans-bold text-[10px] uppercase tracking-[1.2px] text-primary">
                          Añadido
                        </Text>
                      )}
                      <Pressable
                        onPress={() => setInspectingExercise(ex)}
                        hitSlop={10}
                        className="h-8 w-8 items-center justify-center rounded-full bg-border-strong/20"
                      >
                        <Info size={16} color="#8A8A8A" />
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          {/* CTA */}
          <View
            className="border-t border-border px-6 pb-7 pt-3"
            style={{ backgroundColor: '#0A0A0A' }}
          >
            <Button onPress={handleConfirm} disabled={selected.size === 0 || submitting}>
              {selected.size === 0 ? 'Selecciona ejercicios' : `Añadir ${selected.size}`}
            </Button>
          </View>
        </Pressable>
      </Pressable>

      <ExerciseDetailModal
        visible={inspectingExercise !== null}
        exercise={inspectingExercise}
        onClose={() => setInspectingExercise(null)}
      />
    </Modal>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={[
        'rounded-full border px-3 py-1.5 active:opacity-70',
        active ? 'border-primary bg-primary' : 'border-border-strong bg-surface',
      ].join(' ')}
    >
      <Text
        className={[
          'font-sans-bold text-[11px]',
          active ? 'text-background' : 'text-foreground',
        ].join(' ')}
      >
        {label}
      </Text>
    </Pressable>
  );
}
