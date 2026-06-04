import { Plus } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

// CTA secundario al final de la lista de rutinas. Borde discontinuo + chip
// con "+" a la izquierda + texto uppercase. Replica del mockup routines.html.
// Se separa porque podemos reutilizarlo en otros sitios donde "+ crear" sea
// el final lógico de una lista.
export function CreateRoutineDashedButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Crear nueva rutina"
      onPress={onPress}
      className="mt-1 flex-row items-center justify-center gap-3 rounded-[16px] border border-dashed border-border-strong py-4 active:opacity-70"
    >
      <View
        className="h-7 w-7 items-center justify-center rounded-[8px] border border-border"
        style={{ backgroundColor: '#141414' }}
      >
        <Plus color="#FAFAFA" size={14} strokeWidth={2.6} />
      </View>
      <Text className="font-sans-black text-[12px] uppercase tracking-[1.5px] text-foreground">
        Crear nueva rutina
      </Text>
    </Pressable>
  );
}
