import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { SectionHeader } from '@/components/ui/section-header';
import { useDb } from '@/db/db-provider';
import { useRepos } from '@/db/repo-provider';
import type { Badge } from '@/features/achievements/domain/badge';
import { BADGE_CATALOG } from '@/features/achievements/domain/badge-catalog';
import {
  levelFromXP,
  tierForSessions,
  usernameFromDisplayName,
} from '@/features/achievements/domain/progression';
import { BadgeDetailModal } from '@/features/achievements/ui/components/badge-detail-modal';
import { BadgeGrid } from '@/features/achievements/ui/components/badge-grid';
import { XPBar } from '@/features/achievements/ui/components/xp-bar';
import { listRoutines } from '@/features/routines/use-cases/list-routines';
import {
  type Goal,
  type Sex,
  type Unit,
  type UserProfile,
  initialsFromName,
} from '@/features/user/domain/user-profile';
import { getOrCreateProfile } from '@/features/user/use-cases/get-or-create-profile';
import { resetOnboarding } from '@/features/user/use-cases/reset-onboarding';
import { wipeAllData } from '@/features/user/use-cases/wipe-all-data';
import { safeBack } from '@/lib/safe-back';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { ChevronLeft, Pencil, RefreshCcw, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
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

// Profile — pantalla canónica de identidad + datos del usuario.
//
// Arquitectura de la pantalla:
//   - Header: back + título + pencil (edit)
//   - Hero card: avatar grande + nombre + meta + "miembro desde"
//   - Card "Sobre ti": birthDate, sex, bodyWeight
//   - Card "Objetivo": goal + unit (lectura — se editan en edit screen)
//   - Stats mínimas reales: días desde onboarding + rutinas creadas
//   - Privacidad: callout "datos locales" + sync futuro
//   - Acciones destructivas: reset onboarding + wipe all data
//   - Footer: versión + made by
export default function ProfileScreen() {
  const { sqlite } = useDb();
  const { user: profileRepo, routine: routineRepo } = useRepos();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [routinesCount, setRoutinesCount] = useState(0);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [wipeModalOpen, setWipeModalOpen] = useState(false);
  const [wipeConfirmOpen, setWipeConfirmOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Recargamos cada vez que vuelves de /profile/edit — useFocusEffect.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([getOrCreateProfile(profileRepo), listRoutines(routineRepo)]).then(
        ([profileRes, routinesResult]) => {
          if (cancelled) return;
          if (profileRes.ok) setProfile(profileRes.value);
          if (routinesResult.ok) setRoutinesCount(routinesResult.value.length);

          if (!profileRes.ok) console.error('[profile] getProfile error:', profileRes.error);
          if (!routinesResult.ok)
            console.error('[profile] listRoutines error:', routinesResult.error);
        },
      );
      return () => {
        cancelled = true;
      };
    }, [profileRepo, routineRepo]),
  );

  const handleResetOnboarding = async () => {
    setResetModalOpen(false);
    try {
      const result = await resetOnboarding(profileRepo);
      if (!result.ok) throw result.error;

      // Replace para que back no devuelva al perfil.
      router.replace('/welcome');
    } catch (err) {
      console.error('[profile] reset error:', err);
    }
  };

  const handleWipeAllData = async () => {
    setWipeConfirmOpen(false);
    try {
      const result = await wipeAllData(sqlite);
      if (!result.ok) throw result.error;

      router.replace('/welcome');
    } catch (err) {
      console.error('[profile] wipe error:', err);
    }
  };

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="font-sans text-muted">Cargando…</Text>
      </View>
    );
  }

  const initials = initialsFromName(profile.displayName);

  // Edad calculada desde birthDate. Sin librerías.
  const ageLabel = profile.birthDate ? `${calculateAge(profile.birthDate)} años` : 'Sin definir';

  // Gamification — todos los inputs son 0 hasta que existan los slices
  // de workouts/scheduling/sets. La UI YA soporta valores reales sin tocar
  // nada; sólo hay que sustituir estos placeholders por reads cuando lleguen.
  const totalSessions = 0; // → workouts.count
  const currentStreak = 0; // → scheduling + workouts (días consecutivos)
  const totalRecords = 0; // → sets PR detection
  const totalXP = totalSessions * 50; // modelo simple: 1 sesión = 50 XP

  const levelInfo = levelFromXP(totalXP);
  const tier = tierForSessions(totalSessions);
  const username = usernameFromDisplayName(profile.displayName);

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
              onPress={() => router.push('/profile/edit')}
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full border border-border-strong bg-surface active:opacity-70"
            >
              <Pencil color="#A8E055" size={18} strokeWidth={2.4} />
            </Pressable>
          </View>

          {/* Hero card — identidad con anillo + level pill superpuesto */}
          <View className="mt-6 items-center">
            {/* Avatar XL con anillo lima alrededor. El anillo es un
                LinearGradient lima-bright → lima; dentro un círculo dark
                separador; dentro el avatar con gradient lima → lima-bright.
                Compone visualmente "orbe con halo iluminado". */}
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
                    {initials}
                  </Text>
                </LinearGradient>
              </View>
            </LinearGradient>

            {/* Pill "Nivel X" superpuesto en la base del avatar. Negative
                margin para que monte encima del borde. */}
            <View
              className="-mt-3 rounded-full border border-primary bg-background px-3 py-1"
              style={{ zIndex: 2 }}
            >
              <Text className="font-sans-black text-[10px] uppercase tracking-[1.5px] text-primary">
                Nivel {levelInfo.level}
              </Text>
            </View>

            {/* Nombre + meta */}
            <Text className="mt-4 text-center font-sans-black text-[26px] leading-[30px] tracking-[-0.8px] text-foreground">
              {profile.displayName ?? 'Sin nombre'}
            </Text>
            <Text className="mt-1 font-sans-medium text-[12.5px] text-muted">
              {username} · {tier}
            </Text>
          </View>

          {/* XP Bar */}
          <View className="mt-7">
            <XPBar
              level={levelInfo.level}
              currentXP={levelInfo.currentXP}
              xpForNext={levelInfo.xpForNext}
            />
          </View>

          {/* Stats — tres tiles. Entrenos / Racha / Récords. Todos a 0
              hasta que existan workouts/scheduling/sets slices. */}
          <View className="mt-5 flex-row gap-2.5">
            <StatTile value={String(totalSessions)} label="Entrenos" />
            <StatTile value={`${currentStreak}d`} label="Racha" />
            <StatTile value={String(totalRecords)} label="Récords" />
          </View>

          {/* Sección — Sobre ti */}
          <SectionHeader>Sobre ti</SectionHeader>
          <Card>
            <ProfileRow label="Edad" value={ageLabel} />
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
                  ? `${formatWeight(profile.bodyWeight, profile.unit)} ${profile.unit}`
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

          {/* Sección — Logros (UI shell). Estados hardcoded en BADGE_CATALOG
              hasta que existan workouts/sets/balance — esos slices alimentarán
              la evaluación real. Ver achievements/domain/badge-catalog.ts. */}
          <SectionHeader accessory={`${unlockedBadges} / ${totalBadges}`}>Logros</SectionHeader>
          <BadgeGrid badges={BADGE_CATALOG} onPressBadge={setSelectedBadge} />

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
              onPress={() => setResetModalOpen(true)}
            />
            <ActionRow
              icon={Trash2}
              iconColor="#FF3B5C"
              label="Borrar todos los datos"
              description="Elimina rutinas, sesiones y perfil. No se puede deshacer."
              onPress={() => setWipeModalOpen(true)}
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

      {/* Modal — reset onboarding (suave, no destructive) */}
      <ConfirmationModal
        visible={resetModalOpen}
        situation="warning"
        title="¿Reiniciar onboarding?"
        message="Volverás al flow de bienvenida. Tus rutinas y sesiones NO se borran."
        confirmLabel="Reiniciar"
        cancelLabel="Cancelar"
        onConfirm={handleResetOnboarding}
        onCancel={() => setResetModalOpen(false)}
      />

      {/* Modal — wipe paso 1 (advertencia) */}
      <ConfirmationModal
        visible={wipeModalOpen}
        situation="trash"
        title="¿Borrar todos los datos?"
        message="Esto elimina TODO: tu perfil, rutinas, sesiones programadas y registros. Acción irreversible."
        confirmLabel="Continuar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          setWipeModalOpen(false);
          setWipeConfirmOpen(true);
        }}
        onCancel={() => setWipeModalOpen(false)}
      />

      {/* Modal — wipe paso 2 (confirmación final). Doble confirmación porque
          es destructive del todo y el usuario debe parar a pensarlo dos veces. */}
      <ConfirmationModal
        visible={wipeConfirmOpen}
        situation="trash"
        title="Última oportunidad"
        message="Vas a perder todo permanentemente. ¿Seguro?"
        confirmLabel="Sí, borrar todo"
        cancelLabel="No, cancelar"
        onConfirm={handleWipeAllData}
        onCancel={() => setWipeConfirmOpen(false)}
      />

      {/* Modal de detalle de logro — se monta solo cuando hay uno seleccionado */}
      <BadgeDetailModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
    </View>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function StatTile({ value, label }: { value: string; label: string }) {
  // Tile con gradient sutil top-left → bottom-right (surface → surface-2).
  // Da volumen sin ser skeumórfico. Borde por encima del gradient.
  return (
    <View className="flex-1 overflow-hidden rounded-2xl border border-border-strong">
      <LinearGradient
        colors={['#1A1A1A', '#141414']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 16, paddingVertical: 16 }}
      >
        <Text className="font-sans-black text-[26px] leading-[30px] tracking-[-1px] text-foreground">
          {value}
        </Text>
        <Text className="mt-1 font-sans-bold text-[10px] uppercase tracking-[1.4px] text-muted">
          {label}
        </Text>
      </LinearGradient>
    </View>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <Text className="font-sans-medium text-[12px] text-muted">{label}</Text>
      <Text className="font-sans-bold text-[14px] text-foreground">{value}</Text>
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-border" />;
}

function ActionRow({
  icon: Icon,
  iconColor,
  label,
  description,
  onPress,
  destructive = false,
}: {
  icon: typeof Pencil;
  iconColor: string;
  label: string;
  description: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-4 rounded-2xl border border-border-strong bg-surface px-4 py-4 active:opacity-80"
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{
          backgroundColor: destructive ? 'rgba(255, 59, 92, 0.12)' : 'rgba(168, 224, 85, 0.12)',
        }}
      >
        <Icon color={iconColor} size={18} strokeWidth={2.4} />
      </View>
      <View className="flex-1">
        <Text
          className={[
            'font-sans-bold text-[14px]',
            destructive ? 'text-destructive' : 'text-foreground',
          ].join(' ')}
        >
          {label}
        </Text>
        <Text className="mt-0.5 font-sans text-[11px] leading-[16px] text-muted">
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

// Helpers puros (sin librerías).

// Edad en años desde una fecha de nacimiento.
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  // Si el cumpleaños aún no ha llegado este año, restamos uno.
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Conversión a la unidad mostrada. Internamente todo es kg (ADR-0005).
function formatWeight(kg: number, unit: Unit): string {
  const value = unit === 'lb' ? kg * 2.20462 : kg;
  // Una decimal, sin trailing zeros sucios.
  return value.toFixed(1).replace(/\.0$/, '');
}
