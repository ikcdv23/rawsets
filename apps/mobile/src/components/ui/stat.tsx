import { Text, View } from 'react-native';

/**
 * Stat — etiqueta pequeña + número grande (con unidad opcional).
 * Es el bloque de KPI que se repite en Home, Body y el resumen de entreno.
 */
type StatTone = 'default' | 'primary' | 'destructive';

type StatProps = {
  label: string;
  value: string;
  unit?: string;
  tone?: StatTone; // color del número según su significado
};

const valueColor: Record<StatTone, string> = {
  default: 'text-foreground',
  primary: 'text-primary', // dato "bueno" / destacado
  destructive: 'text-destructive', // dato "malo" / alerta
};

export function Stat({ label, value, unit, tone = 'default' }: StatProps) {
  return (
    <View className="rounded-2xl border border-border bg-surface px-4 py-4">
      <Text className="mb-2.5 font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
        {label}
      </Text>
      <View className="flex-row items-baseline">
        <Text className={`font-sans-black text-3xl tracking-[-0.5px] ${valueColor[tone]}`}>
          {value}
        </Text>
        {unit ? <Text className="ml-0.5 font-sans-bold text-base text-muted">{unit}</Text> : null}
      </View>
    </View>
  );
}
