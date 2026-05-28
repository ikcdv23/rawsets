import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InfoModal } from '@/components/ui/info-modal';
import { AvatarIcon } from '@/components/ui/profile/avatar-icon';
import { type RadarAxis, RadarChart } from '@/components/ui/radar-chart';
import { SectionHeader } from '@/components/ui/section-header';
import { Stat } from '@/components/ui/stat';
import { useWorkoutSession } from '@/features/workouts/ui/contexts/workout-session-context';
import { Info } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

// Toggles temporales: simulan estados que vendrán del store/DB.
// - MOCK_HAS_HISTORY: ¿hay sesiones registradas? → afecta radar y KPIs.
// - MOCK_SESSION: ¿qué pinta el bloque "Sesión de hoy"?
// Cuando haya datos reales, se sustituyen por hooks/queries.
const MOCK_HAS_HISTORY: boolean = false;
const MOCK_SESSION: 'workout' | 'rest' | 'free' = 'workout';

// Ejes del radar — siempre los mismos labels, con o sin datos.
const RADAR_DATA: RadarAxis[] = [
  { label: 'Pecho', value: 92 },
  { label: 'Brazos', value: 68 },
  { label: 'Piernas', value: 76 },
  { label: 'Core', value: 55 },
  { label: 'Espalda', value: 38, flagged: true },
  { label: 'Hombros', value: 71 },
];

const RADAR_EMPTY: RadarAxis[] = RADAR_DATA.map((a) => ({ label: a.label, value: 0 }));

export default function HomeScreen() {
  const [radarInfoOpen, setRadarInfoOpen] = useState(false);
  const { activeWorkout, startWorkout, finishWorkout } = useWorkoutSession();

  return (
    <View className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-3 px-6 pb-32 pt-16">
          {/* Top bar: wordmark a la izquierda, avatar (→ perfil) a la derecha. */}
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-sans-black text-2xl tracking-[-0.5px] text-foreground">
              RAWSETS<Text className="text-primary">.</Text>
            </Text>
            <AvatarIcon />
          </View>

          {/* Hero: balance muscular (radar) */}
          <SectionHeader>Balance muscular</SectionHeader>
          <Card>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="font-sans-bold text-foreground">Últimos 14 días</Text>
              {MOCK_HAS_HISTORY ? (
                <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-destructive">
                  Espalda baja
                </Text>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="¿Qué es el balance muscular?"
                  onPress={() => setRadarInfoOpen(true)}
                  className="active:opacity-60"
                  hitSlop={8}
                >
                  <Info color="#8A8A8A" size={18} strokeWidth={2.2} />
                </Pressable>
              )}
            </View>
            <RadarChart
              data={MOCK_HAS_HISTORY ? RADAR_DATA : RADAR_EMPTY}
              empty={!MOCK_HAS_HISTORY}
            />
            {!MOCK_HAS_HISTORY && (
              <Text className="mt-2 text-center font-sans text-[12px] text-muted">
                Tu radar despertará con tu primera sesión.
              </Text>
            )}
          </Card>

          {/* Resumen: 4 KPIs en grid 2x2. "—" cuando no hay histórico. */}
          <SectionHeader>Resumen</SectionHeader>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Stat
                label="Volumen sem"
                value={MOCK_HAS_HISTORY ? '12.4' : '—'}
                unit={MOCK_HAS_HISTORY ? 't' : undefined}
              />
            </View>
            <View className="flex-1">
              <Stat
                label="Sesiones"
                value={MOCK_HAS_HISTORY ? '4' : '—'}
                unit={MOCK_HAS_HISTORY ? '/5' : undefined}
              />
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Stat
                label="PRs · mes"
                value={MOCK_HAS_HISTORY ? '3' : '—'}
                tone={MOCK_HAS_HISTORY ? 'primary' : 'default'}
              />
            </View>
            <View className="flex-1">
              <Stat
                label="Grupos OK"
                value={MOCK_HAS_HISTORY ? '8' : '—'}
                unit={MOCK_HAS_HISTORY ? '/11' : undefined}
                tone={MOCK_HAS_HISTORY ? 'destructive' : 'default'}
              />
            </View>
          </View>

          {/* Sesión de hoy — 3 variantes según MOCK_SESSION */}
          <SectionHeader>Sesión de hoy</SectionHeader>

          {MOCK_SESSION === 'workout' && (
            <Card>
              <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
                Tirón · Día 2 / 5
              </Text>
              <Text className="mt-2 font-sans-black text-3xl tracking-[-0.5px] text-foreground">
                Tirón A
              </Text>
              <Text className="mt-1 font-sans text-sm text-muted">
                Espalda + Bíceps · 6 ejercicios · 22 series
              </Text>
              <View className="mt-4">
                {activeWorkout ? (
                  // Mientras dura el mock-entreno, el botón cierra. Cuando llegue
                  // el flow real, esto desaparece y el cierre vive en el sheet.
                  <Button variant="secondary" onPress={finishWorkout}>
                    Finalizar entreno (dev)
                  </Button>
                ) : (
                  <Button
                    onPress={() =>
                      startWorkout({
                        routineName: 'Tirón A',
                        currentExercise: {
                          name: 'Remo con barra',
                          setNumber: 2,
                          totalSets: 4,
                        },
                      })
                    }
                  >
                    Empezar entreno
                  </Button>
                )}
              </View>
            </Card>
          )}

          {MOCK_SESSION === 'rest' && (
            <Card>
              <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
                Descanso · Día 3 / 5
              </Text>
              <Text className="mt-2 font-sans-black text-3xl tracking-[-0.5px] text-foreground">
                Hoy toca recuperar
              </Text>
              <Text className="mt-2 font-sans text-sm leading-5 text-muted">
                Subir de masa = comer. Apunta a 1.8 g de proteína por kg de peso hoy.
              </Text>
            </Card>
          )}

          {MOCK_SESSION === 'free' && (
            // Sin Card: bloque plano, sutil. Eyebrow + título + link al plan.
            <View className="py-1">
              <Text className="font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
                Hoy
              </Text>
              <Text className="mt-2 font-sans-bold text-lg text-foreground">
                Sin nada programado
              </Text>
              <Pressable
                accessibilityRole="link"
                onPress={() => {
                  // TODO: router.push('/routines') cuando exista el flow de crear rutina
                }}
                className="mt-2 self-start active:opacity-70"
                hitSlop={8}
              >
                <Text className="font-sans-bold text-sm text-primary">+ Programar este día</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      <InfoModal
        visible={radarInfoOpen}
        title="Tu balance muscular"
        message="El radar mide cómo de equilibrado entrenas en los últimos 14 días. Cuanto más entrenes, mejor te conoce."
        onClose={() => setRadarInfoOpen(false)}
      />
    </View>
  );
}
