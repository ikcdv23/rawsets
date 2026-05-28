import type { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

/**
 * SocialButton — botón para auth social (Apple, Google).
 *
 * Variante secundaria con icono a la izquierda. Diferente del Button genérico
 * porque acepta un icono libre (no solo lucide) — Google requiere SVG custom
 * que no encaja con el tipo LucideIcon del Button.
 */
type SocialButtonProps = {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
};

export function SocialButton({ icon, label, onPress }: SocialButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Continuar con ${label}`}
      className="h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border-strong bg-surface active:opacity-80"
    >
      {icon}
      <Text className="font-sans-bold text-[13px] text-foreground">{label}</Text>
    </Pressable>
  );
}
