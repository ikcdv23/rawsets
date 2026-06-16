import { Card } from '@/components/ui/card';
import { InfoModal } from '@/components/ui/info-modal';
import { AvatarIcon } from '@/components/ui/profile/avatar-icon';
import { SectionHeader } from '@/components/ui/section-header';
import { Stat } from '@/components/ui/stat';
import { BalanceRadar } from '@/features/workouts/ui/components/radar';
import { useHome } from '@/features/workouts/ui/hooks/use-home';
import { TodayWorkoutCard } from '@/features/workouts/ui/components/home/today-workout-card';
import { RestDayCard } from '@/features/workouts/ui/components/home/rest-day-card';
import { FreeDayBlock } from '@/features/workouts/ui/components/home/free-day-block';
import { ScrollView, Text, View } from 'react-native';

export default function HomeScreen() {
  const { state, ui, actions } = useHome();

  return (
    <View className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-3 px-6 pb-32 pt-8">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-sans-black text-3xl tracking-[-0.5px] text-foreground">
              RAWSETS<Text className="text-primary">.</Text>
            </Text>
            <AvatarIcon />
          </View>

          {/* Hero: balance muscular (radar). */}
          <SectionHeader>Balance muscular</SectionHeader>
          <BalanceRadar
            data={state.radarAxes}
            empty={!state.hasHistory}
            onPressInfo={ui.openRadarInfo}
            alertLabel={state.flaggedLabel ? `${state.flaggedLabel} bajo` : null}
          />

          {/* Resumen: 4 KPIs en grid 2x2. "—" cuando no hay histórico. */}
          <SectionHeader>Resumen</SectionHeader>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Stat
                label="Volumen sem"
                value={state.hasHistory ? '12.4' : '—'}
                unit={state.hasHistory ? 't' : undefined}
              />
            </View>
            <View className="flex-1">
              <Stat
                label="Sesiones"
                value={state.hasHistory ? '4' : '—'}
                unit={state.hasHistory ? '/5' : undefined}
              />
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Stat
                label="PRs · mes"
                value={state.hasHistory ? '3' : '—'}
                tone={state.hasHistory ? 'primary' : 'default'}
              />
            </View>
            <View className="flex-1">
              <Stat
                label="Grupos OK"
                value={state.hasHistory ? '8' : '—'}
                unit={state.hasHistory ? '/11' : undefined}
                tone={state.hasHistory ? 'destructive' : 'default'}
              />
            </View>
          </View>

          {/* Sesión de hoy — tres variantes derivadas del scheduled_sessions. */}
          <SectionHeader>Sesión de hoy</SectionHeader>

          {state.loading ? (
            <Text className="font-sans text-sm text-muted">Cargando…</Text>
          ) : state.today.kind === 'workout' ? (
            <TodayWorkoutCard
              routine={state.today.routine}
              catalogById={state.catalogById}
              activeWorkout={state.activeWorkout}
              onStart={() => {
                if (state.today.kind === 'workout') {
                  actions.startWorkout(state.today.routine);
                }
              }}
              onFinishDev={actions.finishWorkoutDev}
            />
          ) : state.today.kind === 'rest' ? (
            <RestDayCard />
          ) : (
            <FreeDayBlock onPlan={ui.navigateToRoutines} />
          )}
        </View>
      </ScrollView>

      <InfoModal
        visible={state.radarInfoOpen}
        title="Tu balance muscular"
        message="El radar mide cómo de equilibrado entrenas en los últimos 14 días. Cuanto más entrenes, mejor te conoce."
        onClose={ui.closeRadarInfo}
      />
    </View>
  );
}
