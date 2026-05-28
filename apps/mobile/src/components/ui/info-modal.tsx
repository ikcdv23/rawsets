import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';

/**
 * InfoModal — diálogo informativo con icono lima.
 *
 * Pensado para empty states "value-loaded": el botón ⓘ junto a un placeholder
 * abre este modal y cuenta al usuario qué verá ahí cuando haya datos.
 *
 * Mismo patrón que ConfirmationModal pero sin acción destructiva:
 * un solo CTA de cierre.
 */
type InfoModalProps = {
  visible: boolean;
  title: string;
  message: string;
  closeLabel?: string;
  onClose: () => void;
};

export function InfoModal({
  visible,
  title,
  message,
  closeLabel = 'Entendido',
  onClose,
}: InfoModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center bg-black/60 px-7">
        <Pressable
          onPress={() => {}}
          className="w-full rounded-3xl border border-border-strong bg-surface p-6"
        >
          <View className="mb-5 h-[76px] w-[76px] items-center justify-center self-center rounded-full bg-primary/15">
            <Info color="#A8E055" size={34} strokeWidth={2.4} />
          </View>

          <Text className="text-center font-sans-bold text-2xl tracking-tight text-foreground">
            {title}
          </Text>
          <Text className="mt-2.5 text-center font-sans text-[13px] leading-5 text-muted">
            {message}
          </Text>

          <View className="mt-6">
            <Button variant="primary" onPress={onClose}>
              {closeLabel}
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
