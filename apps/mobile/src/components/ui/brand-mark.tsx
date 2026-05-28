import { Text, View } from 'react-native';

/**
 * BrandMark — el cuadrado lima con la "R" del logotipo de RAWSETS.
 *
 * Sustituye al wordmark solo cuando se quiere PRESENCIA (auth, splash,
 * onboarding). En el día a día de la app, el wordmark de texto basta.
 *
 * Tamaño 64×64 con esquinas redondeadas tipo "squircle".
 */
type BrandMarkProps = {
  size?: number; // lado en px, default 64
};

export function BrandMark({ size = 64 }: BrandMarkProps) {
  return (
    <View
      // RN 0.76+ acepta `boxShadow` (igual que CSS). Sustituye a los shadow* legacy
      // que están deprecated. `elevation` se mantiene para Android pre-boxShadow.
      style={{
        width: size,
        height: size,
        borderRadius: 20,
        boxShadow: '0 0 30px rgba(168, 224, 85, 0.3)',
        elevation: 12,
      }}
      className="items-center justify-center bg-primary"
    >
      <Text
        className="font-sans-black text-background"
        style={{ fontSize: size * 0.5, lineHeight: size * 0.55 }}
      >
        R
      </Text>
    </View>
  );
}
