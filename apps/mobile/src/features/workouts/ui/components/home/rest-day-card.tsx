import { Card } from '@/components/ui/card';
import { Text } from 'react-native';

export function RestDayCard() {
  return (
    <Card>
      <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
        Descanso planificado
      </Text>
      <Text className="mt-2 font-sans-black text-3xl tracking-[-0.5px] text-foreground">
        Hoy toca recuperar
      </Text>
      <Text className="mt-2 font-sans text-sm leading-5 text-muted">
        Subir de masa = comer. Apunta a 1.8 g de proteína por kg de peso hoy.
      </Text>
    </Card>
  );
}
