import { Button } from '@/components/ui/button';
import { HeadTop } from '@/components/ui/head-top';
import { GROUP_LABELS } from '@/features/body-map/domain/muscle-group-map';
import { X } from 'lucide-react-native';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import type { Exercise } from '../../domain/exercise';

export type ExerciseDetailModalProps = {
  visible: boolean;
  exercise: Exercise | null;
  onClose: () => void;
};

export function ExerciseDetailModal({ visible, exercise, onClose }: ExerciseDetailModalProps) {
  if (!exercise) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center bg-black/80 px-6">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full overflow-hidden rounded-[32px] border border-border-strong bg-surface"
        >
          {/* Header con botón cerrar */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-border/10">
            <Text className="font-sans-bold text-[10px] uppercase tracking-[1.8px] text-muted">
              Técnica correcta
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X color="#8A8A8A" size={20} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Visualización */}
            <View className="h-64 w-full items-center justify-center bg-black/20 py-4">
              {exercise.imagePath ? (
                /* 
                   En un caso real, aquí iría el Image o un Video. 
                   Como son assets que el usuario descargará o vendrán en el bundle,
                   usamos un placeholder con el nombre por ahora.
                */
                <View className="items-center justify-center">
                  <View className="h-48 w-48 rounded-2xl bg-border-strong/20 items-center justify-center border border-dashed border-border">
                    <Text className="text-muted-dim font-mono text-[10px] text-center px-4">
                      [ Visual: {exercise.imagePath} ]
                    </Text>
                    <Text className="mt-2 text-muted font-sans text-[12px]">Animación técnica</Text>
                  </View>
                </View>
              ) : (
                <View className="h-48 w-48 rounded-2xl bg-border-strong/20 items-center justify-center">
                  <Text className="text-muted-dim">Sin imagen</Text>
                </View>
              )}
            </View>

            {/* Info */}
            <View className="px-6 pb-8 pt-4">
              <Text className="font-sans-black text-2xl tracking-[-0.5px] text-foreground">
                {exercise.name}
              </Text>

              <Text className="mt-1 font-sans-medium text-[12px] uppercase tracking-[1px] text-accent">
                {exercise.equipment}
              </Text>

              <View className="mt-6">
                <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
                  Músculos implicados
                </Text>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {exercise.muscleGroups.map((mg) => (
                    <View
                      key={mg.group}
                      className="rounded-full bg-border-strong/30 px-3 py-1.5 border border-border/10"
                    >
                      <Text className="font-sans-medium text-[12px] text-foreground">
                        {GROUP_LABELS[mg.group as keyof typeof GROUP_LABELS]}
                        <Text className="text-muted-dim text-[10px]">
                          {' '}
                          {Math.round(mg.weight * 100)}%
                        </Text>
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className="mt-8">
                <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
                  Tips de ejecución
                </Text>
                <View className="mt-3 gap-3">
                  <Text className="font-sans text-[14px] leading-[20px] text-foreground/80">
                    • Mantén el core activado durante todo el movimiento.
                  </Text>
                  <Text className="font-sans text-[14px] leading-[20px] text-foreground/80">
                    • Controla la fase excéntrica (bajada) para máxima tensión.
                  </Text>
                  <Text className="font-sans text-[14px] leading-[20px] text-foreground/80">
                    • No bloquees las articulaciones al final del rango.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="px-6 py-5 border-t border-border/10 bg-black/20">
            <Button onPress={onClose} variant="secondary">
              Entendido
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
