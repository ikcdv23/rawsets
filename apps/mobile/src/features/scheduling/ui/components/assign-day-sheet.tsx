import type { Routine } from '@/features/routines/domain/routine';
import { ChevronRight, Moon, Plus, Trash2 } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { longDayLabel, weekdayName } from '../../domain/dates';
import type { ScheduledSession } from '../../domain/scheduled-session';

// Bottom sheet de asignar entreno a un día. Replica el mockup:
//   - Header: "Asignar entreno" + "Jueves 28 de mayo"
//   - "Mis rutinas" con tarjetas (T/E/P + nombre + meta + arrow)
//   - "Otras opciones": Marcar como descanso, Crear nueva rutina
//   - Si el día YA tiene asignación: opción "Quitar asignación"
//   - (Repetir cada semana → futura iteración, lo dejo comentado)
//
// El sheet NO sabe nada de scheduling/repos. Solo dispara callbacks.
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

export type AssignDaySheetProps = {
  visible: boolean;
  date: Date | null;
  routines: Routine[];
  currentSession: ScheduledSession | null;
  onClose: () => void;
  onAssignRoutine: (routineId: string) => Promise<void>;
  onMarkRest: () => Promise<void>;
  onUnschedule: () => Promise<void>;
  onCreateRoutine: () => void;
};

export function AssignDaySheet({
  visible,
  date,
  routines,
  currentSession,
  onClose,
  onAssignRoutine,
  onMarkRest,
  onUnschedule,
  onCreateRoutine,
}: AssignDaySheetProps) {
  if (!date) return null;

  const weekday = weekdayName(date);
  const dayLabel = longDayLabel(date);
  const headerDate = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${dayLabel}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Cerrar" onPress={onClose} className="flex-1 bg-black/55">
        <Pressable
          onPress={() => {}}
          style={{ backgroundColor: '#0A0A0A' }}
          className="absolute bottom-0 left-0 right-0 max-h-[85%] rounded-t-[28px] border-t border-border-strong"
        >
          <View className="items-center pb-1 pt-2">
            <View className="h-1 w-10 rounded-full bg-border-strong" />
          </View>

          <View className="items-center border-b border-border px-6 pb-4 pt-2">
            <Text className="font-sans-bold text-[10px] uppercase tracking-[1.8px] text-muted">
              Asignar entreno
            </Text>
            <Text className="mt-1 font-sans-black text-2xl tracking-[-0.5px] text-foreground">
              {headerDate}
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 18, paddingBottom: 28, gap: 8 }}
            showsVerticalScrollIndicator={false}
          >
            <Text className="mt-1 font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
              Mis rutinas
            </Text>

            {routines.length === 0 ? (
              <Text className="font-sans text-[13px] text-muted">
                Aún no tienes rutinas. Crea una primero.
              </Text>
            ) : (
              routines.map((r) => {
                const color = colorForName(r.name);
                const letter = initialOf(r.name);
                const isSelected = currentSession?.routineId === r.id;
                const muscles = aggregateMuscles(r);
                const meta = [muscles, `${r.exercises.length} ej`].filter(Boolean).join(' · ');
                return (
                  <Pressable
                    key={r.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => onAssignRoutine(r.id)}
                    style={{
                      backgroundColor: '#141414',
                      borderColor: isSelected ? color : '#1F1F1F',
                      borderWidth: 1,
                    }}
                    className="flex-row items-center gap-3 rounded-[14px] px-3.5 py-3 active:opacity-70"
                  >
                    <View
                      className="h-10 w-10 items-center justify-center rounded-[10px]"
                      style={{
                        backgroundColor: `${color}1A`,
                        borderWidth: 1,
                        borderColor: `${color}55`,
                      }}
                    >
                      <Text
                        className="font-sans-black text-[16px]"
                        style={{ color, letterSpacing: -0.5 }}
                      >
                        {letter}
                      </Text>
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text
                        className="font-sans-bold text-[14px] tracking-[-0.05px] text-foreground"
                        numberOfLines={1}
                      >
                        {r.name}
                      </Text>
                      <Text
                        className="mt-0.5 font-sans-medium text-[11px] text-muted"
                        numberOfLines={1}
                      >
                        {meta}
                      </Text>
                    </View>
                    <ChevronRight color="#4A4A4A" size={16} strokeWidth={2.4} />
                  </Pressable>
                );
              })
            )}

            <Text className="mt-4 font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
              Otras opciones
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={onMarkRest}
              style={{
                backgroundColor: '#141414',
                borderColor: currentSession?.routineId === null ? '#A8E055' : '#1F1F1F',
                borderWidth: 1,
              }}
              className="flex-row items-center gap-3 rounded-[14px] px-3.5 py-3 active:opacity-70"
            >
              <View className="h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-surface">
                <Moon color="#8A8A8A" size={18} strokeWidth={2.2} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-sans-bold text-[14px] tracking-[-0.05px] text-foreground">
                  Marcar como descanso
                </Text>
                <Text className="mt-0.5 font-sans-medium text-[11px] text-muted">
                  Día sin entreno planificado
                </Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={onCreateRoutine}
              style={{ backgroundColor: '#141414' }}
              className="flex-row items-center gap-3 rounded-[14px] border border-border px-3.5 py-3 active:opacity-70"
            >
              <View className="h-10 w-10 items-center justify-center rounded-[10px] border border-border bg-surface">
                <Plus color="#FAFAFA" size={18} strokeWidth={2.4} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-sans-bold text-[14px] tracking-[-0.05px] text-foreground">
                  Crear nueva rutina
                </Text>
                <Text className="mt-0.5 font-sans-medium text-[11px] text-muted">
                  Y asignarla a este día
                </Text>
              </View>
            </Pressable>

            {/* Solo se muestra si el día YA tiene algo asignado. */}
            {currentSession ? (
              <Pressable
                accessibilityRole="button"
                onPress={onUnschedule}
                style={{ backgroundColor: 'rgba(255, 59, 92, 0.06)' }}
                className="mt-1 flex-row items-center gap-3 rounded-[14px] border border-destructive/30 px-3.5 py-3 active:opacity-70"
              >
                <View
                  className="h-10 w-10 items-center justify-center rounded-[10px] border border-destructive/30"
                  style={{ backgroundColor: 'rgba(255, 59, 92, 0.06)' }}
                >
                  <Trash2 color="#FF3B5C" size={18} strokeWidth={2.2} />
                </View>
                <Text className="font-sans-bold text-[14px] text-destructive">
                  Quitar asignación
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Helper: agrega los grupos musculares de la rutina a partir de los IDs de
// ejercicios. Inline porque el sheet ya recibe la Routine completa con
// exercises[]; aquí no podemos resolver Exercise (catálogo) sin más lookups.
// Por ahora devolvemos solo el número de ejercicios como meta — si necesitas
// "Espalda · Bíceps" exacto, el caller debería pasar `muscleSummary` precomputado.
function aggregateMuscles(_r: Routine): string {
  // Placeholder honesto: la agregación correcta necesita el catálogo de
  // ejercicios. Lo deja al caller en una iteración futura.
  return '';
}
