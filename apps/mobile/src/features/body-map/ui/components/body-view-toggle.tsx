import type { ViewSide } from '@/features/body-map/ui/components/body-map';
import { Pressable, Text, View } from 'react-native';

// Toggle FRONT / BACK del BodyMap. Patrón de segmented control:
// dos opciones, una activa con fondo lima, otra inactiva con fondo surface.
//
// Para más de 2 opciones (Fase 2: lateral views?) podríamos abstraerlo,
// pero YAGNI por ahora.
type BodyViewToggleProps = {
  value: ViewSide;
  onChange: (view: ViewSide) => void;
};

const SEGMENTS: { value: ViewSide; label: string }[] = [
  { value: 'FRONT', label: 'Anterior' },
  { value: 'BACK', label: 'Posterior' },
];

export function BodyViewToggle({ value, onChange }: BodyViewToggleProps) {
  return (
    <View className="flex-row gap-1 rounded-full border border-border-strong bg-surface p-1">
      {SEGMENTS.map((seg) => {
        const active = seg.value === value;
        return (
          <Pressable
            key={seg.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(seg.value)}
            className={[
              'flex-1 items-center rounded-full py-2 active:opacity-80',
              active ? 'bg-primary' : '',
            ].join(' ')}
          >
            <Text
              className={[
                'font-sans-bold text-[11px] uppercase tracking-[1.5px]',
                active ? 'text-background' : 'text-muted',
              ].join(' ')}
            >
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
