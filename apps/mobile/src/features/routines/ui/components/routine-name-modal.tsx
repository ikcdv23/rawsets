import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

// Modal genérico para pedir un nombre de rutina. Sirve para CREAR (initialName
// vacío) y para RENOMBRAR (initialName con el nombre actual prellenado).
//
// Mantiene la lógica de submit en estado local — el parent solo recibe la
// cadena final tras la validación. El modal no sabe nada de repos.
export type RoutineNameModalProps = {
  visible: boolean;
  title: string;
  question: string;
  confirmLabel: string;
  initialName?: string;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void>;
};

export function RoutineNameModal({
  visible,
  title,
  question,
  confirmLabel,
  initialName = '',
  onClose,
  onConfirm,
}: RoutineNameModalProps) {
  const [name, setName] = useState(initialName);
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = name.trim().length > 0 && !submitting;

  // Cuando el modal se reabre con un initialName distinto (ej. abrir
  // renombrar de la rutina X y luego de la Y), refrescamos.
  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onConfirm(name);
    } catch (err) {
      console.error('[routine-name-modal] error:', err);
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
          className="w-full max-w-[360px] rounded-[24px] border border-border-strong p-6"
        >
          <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
            {title}
          </Text>
          <Text className="mt-2 font-sans-black text-2xl tracking-[-0.5px] text-foreground">
            {question}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder='Ej. "Tirón A"'
            placeholderTextColor="#4A4A4A"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            selectTextOnFocus
            className="mt-4 rounded-xl border border-border bg-background px-4 py-3 font-sans text-foreground"
            style={{ fontSize: 16 }}
          />
          <View className="mt-5 flex-row gap-3">
            <View className="flex-1">
              <Button variant="secondary" onPress={onClose} disabled={submitting}>
                Cancelar
              </Button>
            </View>
            <View className="flex-1">
              <Button onPress={handleSubmit} disabled={!canSubmit}>
                {confirmLabel}
              </Button>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
