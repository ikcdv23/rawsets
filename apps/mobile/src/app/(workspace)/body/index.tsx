import { HeadTop } from '@/components/ui/head-top';
import { GROUP_LABELS, type PrimaryMuscleGroup } from '@/features/body-map/domain/muscle-group-map';
import { BodyMap, type ViewSide } from '@/features/body-map/ui/components/body-map';
import { BodyViewToggle } from '@/features/body-map/ui/components/body-view-toggle';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

// Body — vista del cuerpo humano con coloreado por grupo muscular.
//
// Estado actual (Fase 1):
//   El coloreado es PURO PLACEHOLDER. Cuando lleguen los slices de
//   workouts/sets/balance, derivaremos `colors` a partir del análisis
//   real (ej. lima = balanceado, amber = atención, rose = desbalance).
//
// Por ahora:
//   - Toggle FRONT / BACK funcional
//   - Tap sobre un grupo lo selecciona y muestra el nombre legible
//   - Color del grupo seleccionado en lima; resto en defaultColor
export default function BodyScreen() {
  const [view, setView] = useState<ViewSide>('FRONT');
  const [selectedGroup, setSelectedGroup] = useState<PrimaryMuscleGroup | null>(null);

  // El mapa de colores que pasamos al BodyMap. Cuando llegue Fase 2:
  //   colors = balanceAnalysis.toColorMap()
  const colors = selectedGroup ? { [selectedGroup]: '#A8E055' } : {};

  return (
    <View className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-3 px-6 pb-32 pt-8">
          <HeadTop title="Cuerpo" />

          {/* Toggle de vista */}
          <View className="mt-2">
            <BodyViewToggle value={view} onChange={setView} />
          </View>

          {/* Lienzo del cuerpo. Aspect ratio del viewBox de body-muscles
              es 35:93 (≈ 0.38), MUY alto. Si dimensionamos por width el
              alto crece muchísimo. Mejor capar por height: 420px de alto
              → ancho derivado ≈ 158px. Cabe cómodo en la pantalla con la
              tarjeta de detalle debajo. */}
          <View className="mt-4 items-center">
            <View style={{ height: 420, aspectRatio: 35 / 93 }}>
              <BodyMap
                view={view}
                colors={colors}
                onPressGroup={(g) => setSelectedGroup((current) => (current === g ? null : g))}
              />
            </View>
          </View>

          {/* Detalle del grupo seleccionado. Placeholder hasta tener datos
              reales de volumen / balance. */}
          <View className="mt-6 rounded-2xl border border-border-strong bg-surface px-5 py-4">
            <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
              {selectedGroup ? 'Grupo seleccionado' : 'Toca un músculo'}
            </Text>
            <Text className="mt-2 font-sans-black text-[20px] tracking-[-0.5px] text-foreground">
              {selectedGroup ? GROUP_LABELS[selectedGroup] : '—'}
            </Text>
            <Text className="mt-1.5 font-sans text-[12px] leading-[18px] text-muted">
              {selectedGroup
                ? 'Volumen y balance llegarán cuando registres sesiones.'
                : 'Cada zona se colorea con sus datos reales en cuanto entrenes.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
