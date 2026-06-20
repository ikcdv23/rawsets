import { HeadTop } from '@/components/ui/head-top';
import { GROUP_LABELS, type PrimaryMuscleGroup } from '@/features/body-map/domain/muscle-group-map';
import { BodyMap, type ViewSide } from '@/features/body-map/ui/components/body-map';
import { BodyViewToggle } from '@/features/body-map/ui/components/body-view-toggle';
import { useBodyAnalysis } from '@/features/body-map/ui/hooks/use-body-analysis';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

// Body — vista del cuerpo humano con coloreado por grupo muscular.
export default function BodyScreen() {
  const [view, setView] = useState<ViewSide>('FRONT');
  const [selectedGroup, setSelectedGroup] = useState<PrimaryMuscleGroup | null>(null);

  const { colors, balanceByGroup, fullBalance, loading, reload } = useBodyAnalysis();

  // Recargar datos al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const selectedData = selectedGroup ? balanceByGroup.get(selectedGroup) : null;

  // Mezclar el heatmap con el resaltado del grupo seleccionado
  const displayColors = {
    ...colors,
    ...(selectedGroup ? { [selectedGroup]: '#A8E055' } : {}),
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-3 px-6 pb-32 pt-8">
          <HeadTop title="Cuerpo" />

          {/* Toggle de vista y Leyenda */}
          <View className="mt-2 flex-row justify-between items-center">
            <BodyViewToggle value={view} onChange={setView} />
            <View className="flex-row gap-4">
              <LegendItem color="#B8FA82" label="Alto" />
              <LegendItem color="#B8FA8266" label="Ok" />
              <LegendItem color="#B8FA8222" label="Bajo" />
            </View>
          </View>

          {/* Lienzo del cuerpo. */}
          <View className="mt-4 items-center rounded-3xl bg-surface border border-border p-4">
            <View style={{ height: 400, aspectRatio: 35 / 93 }}>
              <BodyMap
                view={view}
                colors={displayColors}
                onPressGroup={(g) => setSelectedGroup((current) => (current === g ? null : g))}
              />
            </View>
          </View>

          {/* Detalle del grupo seleccionado. */}
          <View className="mt-2 rounded-2xl border border-border-strong bg-surface px-5 py-4">
            <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
              {selectedGroup ? 'Detalle histórico (90d)' : 'Toca un músculo'}
            </Text>

            <View className="mt-2 flex-row items-baseline justify-between">
              <Text className="font-sans-black text-[20px] tracking-[-0.5px] text-foreground">
                {selectedGroup ? GROUP_LABELS[selectedGroup] : 'Selección'}
              </Text>
              {selectedData && selectedData.volumeKg > 0 && (
                <Text className="font-mono text-[16px] text-accent">{selectedData.percent}%</Text>
              )}
            </View>

            {selectedGroup ? (
              <>
                <View className="mt-3 flex-row gap-4 border-t border-border/10 pt-3">
                  <View className="flex-1">
                    <Text className="font-sans text-[11px] text-muted">Volumen Total</Text>
                    <Text className="font-mono text-[15px] text-foreground">
                      {selectedData ? Math.round(selectedData.volumeKg).toLocaleString() : '0'}{' '}
                      <Text className="text-[10px] text-muted">kg</Text>
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans text-[11px] text-muted">Frecuencia</Text>
                    <Text className="font-sans text-[15px] text-foreground">
                      {selectedData && selectedData.volumeKg > 0 ? 'Activo' : 'Sin datos'}
                    </Text>
                  </View>
                </View>

                <Text className="mt-4 font-sans text-[12px] leading-[18px] text-muted">
                  {selectedData && selectedData.volumeKg > 0
                    ? `Has acumulado ${Math.round(selectedData.volumeKg)} kg de trabajo en este grupo durante los últimos 3 meses.`
                    : 'Aún no has registrado ejercicios para este grupo muscular en el periodo seleccionado.'}
                </Text>
              </>
            ) : (
              <Text className="mt-2 font-sans text-[12px] leading-[18px] text-muted">
                Toca cualquier zona del cuerpo para ver tu progreso histórico acumulado en esa área.
              </Text>
            )}
          </View>

          {/* Punto débil — si hay algún grupo por debajo del 40% (y hay datos en general) */}
          {fullBalance.length > 0 && fullBalance[fullBalance.length - 1]!.percent < 40 && (
            <View className="mt-4 flex-row items-center gap-3 rounded-xl border border-rose/30 bg-rose/10 px-4 py-3">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-rose/20">
                <View className="h-1.5 w-1.5 rounded-full bg-rose" />
              </View>
              <View className="flex-1">
                <Text className="font-sans-bold text-[10px] uppercase tracking-[1px] text-rose">
                  Punto débil
                </Text>
                <Text className="font-sans-bold text-[13px] text-foreground">
                  {
                    GROUP_LABELS[
                      fullBalance[fullBalance.length - 1]!.muscleGroup as PrimaryMuscleGroup
                    ]
                  }{' '}
                  — necesita más atención
                </Text>
              </View>
            </View>
          )}

          {/* Lista de grupos musculares */}
          <View className="mt-8">
            <Text className="font-sans-bold text-[10px] uppercase tracking-[1.8px] text-muted-dim mb-4">
              Distribución por volumen
            </Text>
            <View className="gap-3">
              {balanceByGroup.size > 0 ? (
                Array.from(balanceByGroup.values())
                  .sort((a, b) => b.percent - a.percent)
                  .map((item) => (
                    <Pressable
                      key={item.muscleGroup}
                      onPress={() => setSelectedGroup(item.muscleGroup as PrimaryMuscleGroup)}
                      className={[
                        'flex-row items-center gap-4 px-2 py-1',
                        selectedGroup === item.muscleGroup ? 'opacity-100' : 'opacity-70',
                      ].join(' ')}
                    >
                      <Text className="w-24 font-sans-medium text-[13px] text-foreground">
                        {GROUP_LABELS[item.muscleGroup as PrimaryMuscleGroup]}
                      </Text>
                      <View className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-accent"
                          style={{ width: `${Math.max(2, item.percent)}%` }}
                        />
                      </View>
                      <Text className="w-8 font-mono text-[12px] text-right text-muted">
                        {item.percent}
                      </Text>
                    </Pressable>
                  ))
              ) : (
                <Text className="text-center font-sans text-muted py-8">
                  Registra tus entrenos para ver la distribución.
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="font-sans-bold text-[9px] uppercase tracking-[1px] text-muted-dim">
        {label}
      </Text>
    </View>
  );
}
