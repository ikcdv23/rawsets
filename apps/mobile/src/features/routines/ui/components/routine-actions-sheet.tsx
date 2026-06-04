import { Pencil, Trash2 } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';

// Bottom sheet de acciones de la rutina. Replica el patrón del mockup:
// el icono "…" del header abre este sheet con las acciones secundarias.
//
// Acciones actuales: renombrar (no-destructiva) + borrar (destructiva,
// envuelta en confirmation después). Si crece a más opciones (duplicar,
// exportar, compartir), siguen el mismo patrón de Pressable por fila.
export type RoutineActionsSheetProps = {
  visible: boolean;
  onClose: () => void;
  onAskRename: () => void;
  onAskDelete: () => void;
};

export function RoutineActionsSheet({
  visible,
  onClose,
  onAskRename,
  onAskDelete,
}: RoutineActionsSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Cerrar" onPress={onClose} className="flex-1 bg-black/55">
        <Pressable
          onPress={() => {}}
          style={{ backgroundColor: '#0A0A0A' }}
          className="absolute bottom-0 left-0 right-0 rounded-t-[28px] border-t border-border-strong px-6 pb-10 pt-3"
        >
          <View className="items-center pb-3">
            <View className="h-1 w-10 rounded-full bg-border-strong" />
          </View>

          <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
            Acciones
          </Text>

          {/* Renombrar — acción neutra arriba. */}
          <Pressable
            accessibilityRole="button"
            onPress={onAskRename}
            className="mt-4 flex-row items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-4 active:opacity-70"
          >
            <Pencil color="#FAFAFA" size={18} strokeWidth={2.2} />
            <Text className="font-sans-bold text-[14px] text-foreground">Renombrar</Text>
          </Pressable>

          {/* Borrar — destructiva abajo, con borde tinted. */}
          <Pressable
            accessibilityRole="button"
            onPress={onAskDelete}
            className="mt-2 flex-row items-center gap-3 rounded-2xl border border-destructive/30 px-4 py-4 active:opacity-70"
            style={{ backgroundColor: 'rgba(255, 59, 92, 0.06)' }}
          >
            <Trash2 color="#FF3B5C" size={18} strokeWidth={2.2} />
            <Text className="font-sans-bold text-[14px] text-destructive">Borrar rutina</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
