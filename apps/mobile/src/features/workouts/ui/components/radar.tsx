import { Card } from '@/components/ui/card';
import { type RadarAxis, RadarChart } from '@/components/ui/radar-chart';
import { Info } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

// BalanceRadar — vista del radar de balance muscular para la home.
//
// Componente "tonto": recibe DATOS por props, no toma decisiones de negocio
// ni gestiona estado del modal. Su único trabajo es PINTAR el radar con el
// header apropiado según haya datos o no.
//
// Por qué este patrón:
//   - Reusable: este mismo componente podría aparecer en stats/, profile/,
//     en un widget de share-screen futuro. Si supiera por sí mismo si
//     "tienes datos" estaría acoplado al home.
//   - Testable: pasarle data + empty=true se prueba en 1 línea.
//   - El padre (home) decide CUÁNDO mostrar el modal y QUÉ datos pasar.
//
// Si necesitas más estados visuales (e.g. "datos parciales", "comparativa
// con semana anterior"), añades más props — no más lógica interna.
type BalanceRadarProps = {
  data: RadarAxis[];
  // Cuando true, el radar se pinta en modo vacío (todos los ejes a 0) y
  // muestra el copy "Tu radar despertará con tu primera sesión."
  empty: boolean;
  // Tap en el icono "?" del header. Sólo se muestra en modo `empty` —
  // si hay datos, el icono se reemplaza por un chip de aviso.
  onPressInfo: () => void;
  // En modo no-empty, mensaje del chip de aviso superior derecho (e.g.
  // "Espalda baja", "Hombro derecho"). null = no mostrar chip.
  alertLabel?: string | null;
};

export function BalanceRadar({ data, empty, onPressInfo, alertLabel }: BalanceRadarProps) {
  return (
    <Card glow glowPosition="center" glowOpacity={0.16}>
      {/* Header: título + accesorio (info button o chip de alerta) */}
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="font-sans-bold text-foreground">Últimos 14 días</Text>

        {empty ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="¿Qué es el balance muscular?"
            onPress={onPressInfo}
            className="active:opacity-60"
            hitSlop={8}
          >
            <Info color="#8A8A8A" size={18} strokeWidth={2.2} />
          </Pressable>
        ) : alertLabel ? (
          <Text className="font-sans-bold text-[10px] text-destructive uppercase tracking-[1.5px]">
            {alertLabel}
          </Text>
        ) : null}
      </View>

      <RadarChart data={data} empty={empty} />

      {empty ? (
        <Text className="mt-2 text-center font-sans text-[12px] text-muted">
          Tu radar despertará con tu primera sesión.
        </Text>
      ) : null}
    </Card>
  );
}
