import { Card } from '@/components/ui/card';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { SectionHeader } from '@/components/ui/section-header';
import { BADGE_CATALOG } from '@/features/achievements/domain/badge-catalog';
import { BadgeDetailModal } from '@/features/achievements/ui/components/badge-detail-modal';
import { BadgeGrid } from '@/features/achievements/ui/components/badge-grid';
import { XPBar } from '@/features/achievements/ui/components/xp-bar';
import { type Goal, type Sex, type Unit } from '@/features/user/domain/user-profile';
import { useProfile } from '@/features/user/ui/hooks/use-profile';
import { StatTile } from '@/features/user/ui/components/profile/stat-tile';
import { ProfileRow, Divider } from '@/features/user/ui/components/profile/profile-row';
import { ActionRow } from '@/features/user/ui/components/profile/action-row';
import { safeBack } from '@/lib/safe-back';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Pencil, RefreshCcw, Trash2 } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

const GOAL_LABELS: Record<Goal, string> = {
  mass: 'Subir masa',
  strength: 'Fuerza',
  loss: 'Bajar grasa',
  maintenance: 'Mantenimiento',
  general: 'Vida sana',
};

const UNIT_LABELS: Record<Unit, string> = {
  kg: 'kg',
  lb: 'lb',
};

const SEX_LABELS: Record<Sex, string> = {
  male: 'Hombre',
  female: 'Mujer',
  other: 'Otro',
};

export default function ProfileScreen() {
  const { state, ui, actions } = useProfile();

  if (state.loading || !state.profile || !state.derived) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="font-sans text-muted">Cargando…</Text>
      </View>
    );
  }

  const { profile, derived, routinesCount } = state;

  // Contador de logros desbloqueados / totales para el SectionHeader.
  const unlockedBadges = BADGE_CATALOG.filter((b) => b.state !== 'locked').length;
  const totalBadges = BADGE_CATALOG.length;

  return (
    <View className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-20 pt-8">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={() => safeBack('/home')}
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full border border-border-strong bg-surface active:opacity-70"
            >
              <ChevronLeft color="#FAFAFA" size={20} strokeWidth={2.4} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Editar perfil"
              onPress={ui.navigateToEdit}
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full border border-border-strong bg-surface active:opacity-70"
            >
              <Pencil color="#A8E055" size={18} strokeWidth={2.4} />
            </Pressable>
          </View>

          {/* Hero card — identidad con anillo + level pill superpuesto */}
          <View className="mt-6 items-center">
            <LinearGradient
              colors={['#C3F56E', '#A8E055']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 124,
                height: 124,
                borderRadius: 62,
                padding: 3,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                className="h-full w-full items-center justify-center rounded-full"
                style={{ backgroundColor: '#0A0A0A' }}
              >
                <LinearGradient
                  colors={['#B8E96B', '#A8E055']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 104,
                    height: 104,
                    borderRadius: 52,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    className="font-sans-black"
                    style={{ fontSize: 40, color: '#0A0A0A', letterSpacing: -1.5 }}
                  >
                    {derived.initials}
                  </Text>
                </LinearGradient>
              </View>
            </LinearGradient>

            <View
              className="-mt-3 rounded-full border border-primary bg-background px-3 py-1"
              style={{ zIndex: 2 }}
            >
              <Text className="font-sans-black text-[10px] uppercase tracking-[1.5px] text-primary">
                Nivel {derived.levelInfo.level}
              </Text>
            </View>

            <Text className="mt-4 text-center font-sans-black text-[26px] leading-[30px] tracking-[-0.8px] text-foreground">
              {profile.displayName ?? 'Sin nombre'}
            </Text>
            <Text className="mt-1 font-sans-medium text-[12.5px] text-muted">
              {derived.username} · {derived.tier}
            </Text>
          </View>

          {/* XP Bar */}
          <View className="mt-7">
            <XPBar
              level={derived.levelInfo.level}
              currentXP={derived.levelInfo.currentXP}
              xpForNext={derived.levelInfo.xpForNext}
            />
          </View>

          {/* Stats */}
          <View className="mt-5 flex-row gap-2.5">
            <StatTile value={String(derived.totalSessions)} label="Entrenos" />
            <StatTile value={`${derived.currentStreak}d`} label="Racha" />
            <StatTile value={String(derived.totalRecords)} label="Récords" />
          </View>

          {/* Sección — Sobre ti */}
          <SectionHeader>Sobre ti</SectionHeader>
          <Card>
            <ProfileRow label="Edad" value={derived.ageLabel} />
            <Divider />
            <ProfileRow
              label="Sexo"
              value={profile.sex ? SEX_LABELS[profile.sex] : 'Sin definir'}
            />
            <Divider />
            <ProfileRow
              label="Peso corporal"
              value={
                profile.bodyWeight !== null
                  ? `${derived.formattedWeight} ${profile.unit}`
                  : 'Sin definir'
              }
            />
          </Card>

          {/* Sección — Objetivo */}
          <SectionHeader>Objetivo</SectionHeader>
          <Card>
            <ProfileRow label="Buscas" value={GOAL_LABELS[profile.goal]} />
            <Divider />
            <ProfileRow label="Unidad" value={UNIT_LABELS[profile.unit]} />
          </Card>

          {/* Sección — Logros */}
          <SectionHeader>Logros (UI shell)</SectionHeader>
          <BadgeGrid badges={BADGE_CATALOG} onPressBadge={ui.selectBadge} />

          {/* Sección — Datos y privacidad */}
          <SectionHeader>Datos y privacidad</SectionHeader>
          <Card>
            <Text className="font-sans-bold text-[12px] text-foreground">
              📍 Tus datos viven en tu dispositivo
            </Text>
            <Text className="mt-1.5 font-sans text-[12px] leading-[18px] text-muted">
              RAWSETS no envía nada a ningún servidor. Sync por cuenta llegará en la próxima fase.
            </Text>
          </Card>

          {/* Acciones */}
          <SectionHeader>Acciones</SectionHeader>
          <View className="gap-2">
            <ActionRow
              icon={RefreshCcw}
              iconColor="#A8E055"
              label="Reiniciar onboarding"
              description="Vuelves al flow de bienvenida. Tus datos NO se borran."
              onPress={ui.openResetModal}
            />
            <ActionRow
              icon={Trash2}
              iconColor="#FF3B5C"
              label="Borrar todos los datos"
              description="Elimina rutinas, sesiones y perfil. No se puede deshacer."
              onPress={ui.openWipeModal}
              destructive
            />
          </View>

          {/* Footer marca */}
          <View className="mt-12 items-center">
            <Text className="font-mono text-[10px] uppercase tracking-[1.8px] text-muted-dim">
              RAWSETS · v0.1
            </Text>
            <Text className="mt-1 font-sans text-[10px] text-muted-dim">
              Hecho con saña por Javier · 2026
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modales */}
      <ConfirmationModal
        visible={ui.isResetModalOpen}
        situation="warning"
        title="¿Reiniciar onboarding?"
        message="Volverás al flow de bienvenida. Tus rutinas y sesiones NO se borran."
        confirmLabel="Reiniciar"
        cancelLabel="Cancelar"
        onConfirm={actions.resetOnboarding}
        onCancel={ui.closeResetModal}
      />

      <ConfirmationModal
        visible={ui.isWipeModalOpen}
        situation="trash"
        title="¿Borrar todos los datos?"
        message="Esto elimina TODO: tu perfil, rutinas, sesiones programadas y registros. Acción irreversible."
        confirmLabel="Continuar"
        cancelLabel="Cancelar"
        onConfirm={ui.openWipeConfirm}
        onCancel={ui.closeWipeModal}
      />

      <ConfirmationModal
        visible={ui.isWipeConfirmOpen}
        situation="trash"
        title="Última oportunidad"
        message="Vas a perder todo permanentemente. ¿Seguro?"
        confirmLabel="Sí, borrar todo"
        cancelLabel="No, cancelar"
        onConfirm={actions.wipeAllData}
        onCancel={ui.closeWipeConfirm}
      />

      <BadgeDetailModal badge={state.selectedBadge} onClose={() => ui.selectBadge(null)} />
    </View>
  );
}
