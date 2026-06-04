import { Button } from '@/components/ui/button';
import { useDb } from '@/db/db-provider';
import { DrizzleSqliteUserProfileRepo } from '@/features/user/adapters/drizzle-sqlite-user-profile-repo';
import { GOALS, type Goal } from '@/features/user/domain/user-profile';
import { OnboardingShell } from '@/features/user/ui/onboarding/onboarding-shell';
import { SelectCard } from '@/features/user/ui/onboarding/select-card';
import { getOrCreateProfile } from '@/features/user/use-cases/get-or-create-profile';
import { updateProfile } from '@/features/user/use-cases/update-profile';
import { router } from 'expo-router';
import {
  ArrowRight,
  Dumbbell,
  Equal,
  Flame,
  Leaf,
  type LucideIcon,
  Zap,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

// Step 2 — Objetivo. Una sola selección, requerido (todos los usuarios
// tienen un norte; ya está 'general' como default si no quieren elegir uno
// específico — pero les obligamos a confirmar para que se sienta consciente).
type GoalOption = {
  value: Goal;
  label: string;
  description: string;
  icon: LucideIcon;
};

const OPTIONS: GoalOption[] = [
  { value: 'mass', label: 'Subir masa', description: 'Hipertrofia y volumen.', icon: Dumbbell },
  { value: 'strength', label: 'Fuerza', description: 'Cargas altas, baja reps.', icon: Zap },
  { value: 'loss', label: 'Bajar grasa', description: 'Definición y déficit.', icon: Flame },
  {
    value: 'maintenance',
    label: 'Mantenimiento',
    description: 'Mantener lo conseguido.',
    icon: Equal,
  },
  {
    value: 'general',
    label: 'Vida sana',
    description: 'Estar activo, sin objetivo concreto.',
    icon: Leaf,
  },
];

export default function OnboardingGoalScreen() {
  const { db, sqlite } = useDb();
  const repo = useMemo(() => new DrizzleSqliteUserProfileRepo(db, sqlite), [db, sqlite]);

  const [selected, setSelected] = useState<Goal | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOrCreateProfile(repo).then((p) => {
      if (!cancelled && p.goal && GOALS.includes(p.goal)) setSelected(p.goal);
    });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  const handleContinue = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await updateProfile(repo, { goal: selected });
      router.push('/unit');
    } catch (err) {
      console.error('[onboarding/goal] save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingShell
      step={3}
      totalSteps={6}
      title="¿Qué te trae aquí?"
      subtitle="Esto ajusta lo que destacaremos en tus stats."
      footer={
        <Button icon={ArrowRight} onPress={handleContinue} disabled={!selected || saving}>
          Continuar
        </Button>
      }
    >
      <View className="gap-2">
        {OPTIONS.map((opt) => (
          <SelectCard
            key={opt.value}
            label={opt.label}
            description={opt.description}
            icon={opt.icon}
            active={selected === opt.value}
            onPress={() => setSelected(opt.value)}
          />
        ))}
      </View>
    </OnboardingShell>
  );
}
