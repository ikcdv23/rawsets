import { Trash2, X } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

// Barra de selección que reemplaza al header cuando estás en modo selección.
//
// Patrón clásico mobile (Gmail/Fotos/iOS Photos):
//   [X] cancelar    "N seleccionadas"    [🗑 N] borrar
//
// Se renderiza en el mismo slot del header. El parent controla el modo.
export type RoutinesSelectionBarProps = {
  count: number;
  onCancel: () => void;
  onDelete: () => void;
};

export function RoutinesSelectionBar({ count, onCancel, onDelete }: RoutinesSelectionBarProps) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Pressable
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Cancelar selección"
        hitSlop={8}
        className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface active:opacity-70"
      >
        <X color="#FAFAFA" size={18} strokeWidth={2.4} />
      </Pressable>

      <Text className="flex-1 font-sans-black text-[15px] tracking-[-0.2px] text-foreground">
        {count} {count === 1 ? 'seleccionada' : 'seleccionadas'}
      </Text>

      <Pressable
        onPress={onDelete}
        disabled={count === 0}
        accessibilityRole="button"
        accessibilityLabel={`Borrar ${count}`}
        hitSlop={8}
        className={[
          'h-10 flex-row items-center gap-1.5 rounded-full border px-3.5 active:opacity-70',
          count === 0 ? 'border-border opacity-40' : 'border-destructive/40',
        ].join(' ')}
        style={count > 0 ? { backgroundColor: 'rgba(255, 59, 92, 0.08)' } : undefined}
      >
        <Trash2 color="#FF3B5C" size={16} strokeWidth={2.2} />
        <Text className="font-sans-bold text-[13px] text-destructive">{count}</Text>
      </Pressable>
    </View>
  );
}
