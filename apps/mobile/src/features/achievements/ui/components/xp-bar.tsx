import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

// Barra de XP del usuario.
//
//   ┌───────────────────────────────────────┐
//   │ NIVEL 7              340 / 500 XP    │
//   ├──────────────────────┬────────────────┤
//   │██████████████████░░░░│                │
//   └──────────────────────┴────────────────┘
//
// Patrón visual: eyebrow "NIVEL X" a la izquierda, contador XP a la
// derecha en mono-bold (para que los números no bailen). Debajo, barra
// fina lima que crece según el ratio.
//
// Sin animación de momento — Fase 2, cuando XP cambie en tiempo real
// tras una sesión, le metemos spring para que el llenado se sienta vivo.
type XPBarProps = {
  level: number;
  currentXP: number;
  xpForNext: number;
};

export function XPBar({ level, currentXP, xpForNext }: XPBarProps) {
  const ratio = Math.max(0, Math.min(1, currentXP / xpForNext));
  // RN tipa width como `DimensionValue` (number | `${number}%` | …). El
  // satisfies fuerza el formato exacto que TS espera.
  const widthPct: `${number}%` = `${Number((ratio * 100).toFixed(1))}%`;

  return (
    <View>
      {/* Top row — eyebrow + contador */}
      <View className="flex-row items-baseline justify-between">
        <Text className="font-sans-bold text-[11px] uppercase tracking-[1.8px] text-muted">
          Nivel <Text className="text-foreground">{level}</Text>
        </Text>
        <Text className="font-mono-bold text-[12px] tracking-[0.4px] text-primary">
          {currentXP} / {xpForNext} XP
        </Text>
      </View>

      {/* Bar — gradient lima → lima-bright (left to right). Sutil pero da
          la sensación de "energía" creciente al avanzar de nivel. */}
      <View className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-border">
        <LinearGradient
          colors={['#A8E055', '#C3F56E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: '100%', width: widthPct, borderRadius: 9999 }}
        />
      </View>
    </View>
  );
}
