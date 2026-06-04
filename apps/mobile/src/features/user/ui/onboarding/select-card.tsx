import { Check, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

// Tarjeta seleccionable grande — para goal / unit / sex.
//
// Diseño: lista vertical de cards. Cada una tap-area enorme. Cuando se
// selecciona, fondo lima + check icon. Sin ruido.
//
// Animación: scale leve al estar activa (1 → 1.015) + opacity smooth. El
// check entra con fade. useNativeDriver=true porque solo movemos opacity y
// transform.
//
// Visual leading:
//   - icon (lucide) → registro formal/elegante (profile/edit)
//   - emoji        → registro juguetón (onboarding)
//   Si ambos vienen, el icon tiene precedencia (más profesional).
type SelectCardProps = {
  label: string;
  description?: string;
  emoji?: string;
  icon?: LucideIcon;
  active: boolean;
  onPress: () => void;
};

export function SelectCard({
  label,
  description,
  emoji,
  icon: Icon,
  active,
  onPress,
}: SelectCardProps) {
  const scale = useRef(new Animated.Value(active ? 1.015 : 1)).current;
  const checkOpacity = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: active ? 1.015 : 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(checkOpacity, {
        toValue: active ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [active, scale, checkOpacity]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={active ? { selected: true } : {}}
        onPress={onPress}
        className={[
          'flex-row items-center gap-4 rounded-2xl border px-5 py-4 active:opacity-90',
          active ? 'border-primary bg-primary/15' : 'border-border-strong bg-surface',
        ].join(' ')}
      >
        {/* Visual leading — icon prevalece sobre emoji si los dos vienen. */}
        {Icon ? (
          <View
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{
              backgroundColor: active ? '#A8E055' : 'rgba(168, 224, 85, 0.12)',
            }}
          >
            <Icon color={active ? '#0A0A0A' : '#A8E055'} size={20} strokeWidth={2.4} />
          </View>
        ) : emoji ? (
          <Text className="text-[26px]">{emoji}</Text>
        ) : null}
        <View className="flex-1">
          <Text
            className={[
              'font-sans-bold text-[16px] tracking-tight',
              active ? 'text-primary' : 'text-foreground',
            ].join(' ')}
          >
            {label}
          </Text>
          {description ? (
            <Text className="mt-0.5 font-sans text-[12px] text-muted">{description}</Text>
          ) : null}
        </View>
        {/* Check con fade — siempre ocupa espacio para que el layout no
            salte cuando se selecciona. */}
        <Animated.View style={{ opacity: checkOpacity }}>
          <View className="h-7 w-7 items-center justify-center rounded-full bg-primary">
            <Check color="#0A0A0A" size={16} strokeWidth={3} />
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
