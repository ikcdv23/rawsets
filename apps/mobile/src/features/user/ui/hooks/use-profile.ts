import { useDb } from '@/db/db-provider';
import { useRepos } from '@/db/repo-provider';
import type { Badge } from '@/features/achievements/domain/badge';
import {
  levelFromXP,
  tierForSessions,
  usernameFromDisplayName,
} from '@/features/achievements/domain/progression';
import { listRoutines } from '@/features/routines/use-cases/list-routines';
import {
  type UserProfile,
  calculateAge,
  formatWeight,
  initialsFromName,
} from '@/features/user/domain/user-profile';
import { getOrCreateProfile } from '@/features/user/use-cases/get-or-create-profile';
import { resetOnboarding } from '@/features/user/use-cases/reset-onboarding';
import { wipeAllData } from '@/features/user/use-cases/wipe-all-data';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

export function useProfile() {
  const router = useRouter();
  const { sqlite } = useDb();
  const { user: profileRepo, routine: routineRepo } = useRepos();

  // Estados de datos
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [routinesCount, setRoutinesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Estados de UI (modales)
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [wipeModalOpen, setWipeModalOpen] = useState(false);
  const [wipeConfirmOpen, setWipeConfirmOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Carga de datos
  const reload = useCallback(async () => {
    try {
      const [profileRes, routinesResult] = await Promise.all([
        getOrCreateProfile(profileRepo),
        listRoutines(routineRepo),
      ]);

      if (profileRes.ok) setProfile(profileRes.value);
      if (routinesResult.ok) setRoutinesCount(routinesResult.value.length);

      if (!profileRes.ok) console.error('[useProfile] getProfile error:', profileRes.error);
      if (!routinesResult.ok)
        console.error('[useProfile] listRoutines error:', routinesResult.error);
    } catch (err) {
      console.error('[useProfile] unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, [profileRepo, routineRepo]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  // Datos derivados (Memoizados)
  const derived = useMemo(() => {
    if (!profile) return null;

    const totalSessions = 0; // TODO: Conectar con workouts repo
    const totalXP = totalSessions * 50;
    const levelInfo = levelFromXP(totalXP);
    const age = calculateAge(profile.birthDate);

    return {
      initials: initialsFromName(profile.displayName),
      username: usernameFromDisplayName(profile.displayName),
      tier: tierForSessions(totalSessions),
      levelInfo,
      ageLabel: age !== null ? `${age} años` : 'Sin definir',
      formattedWeight: formatWeight(profile.bodyWeight, profile.unit),
      totalSessions,
      currentStreak: 0, // TODO: Conectar con scheduling
      totalRecords: 0, // TODO: Conectar con PRs logic
    };
  }, [profile]);

  // Acciones
  const handleResetOnboarding = async () => {
    setResetModalOpen(false);
    const result = await resetOnboarding(profileRepo);
    if (result.ok) {
      router.replace('/welcome');
    } else {
      console.error('[useProfile] reset error:', result.error);
    }
  };

  const handleWipeAllData = async () => {
    setWipeConfirmOpen(false);
    const result = await wipeAllData(sqlite);
    if (result.ok) {
      router.replace('/welcome');
    } else {
      console.error('[useProfile] wipe error:', result.error);
    }
  };

  return {
    state: {
      profile,
      routinesCount,
      loading,
      derived,
      selectedBadge,
    },
    ui: {
      isResetModalOpen: resetModalOpen,
      openResetModal: () => setResetModalOpen(true),
      closeResetModal: () => setResetModalOpen(false),
      isWipeModalOpen: wipeModalOpen,
      openWipeModal: () => setWipeModalOpen(true),
      closeWipeModal: () => setWipeModalOpen(false),
      isWipeConfirmOpen: wipeConfirmOpen,
      openWipeConfirm: () => {
        setWipeModalOpen(false);
        setWipeConfirmOpen(true);
      },
      closeWipeConfirm: () => setWipeConfirmOpen(false),
      selectBadge: (badge: Badge | null) => setSelectedBadge(badge),
      navigateToEdit: () => router.push('/profile/edit'),
    },
    actions: {
      resetOnboarding: handleResetOnboarding,
      wipeAllData: handleWipeAllData,
    },
  };
}
