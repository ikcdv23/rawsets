import { Button } from '@/components/ui/button';
import { useRepos } from '@/db/repo-provider';
import { UNITS, type Unit } from '@/features/user/domain/user-profile';
import { OnboardingShell } from '@/features/user/ui/onboarding/onboarding-shell';
import { SelectCard } from '@/features/user/ui/onboarding/select-card';
import { getOrCreateProfile } from '@/features/user/use-cases/get-or-create-profile';
import { updateProfile } from '@/features/user/use-cases/update-profile';
import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

// Step 3 — Unidad. kg / lb. Internamente siempre kg (ver ADR-0005), esto
// solo cambia el display.
type UnitOption = {
  value: Unit;
  label: string;
  description: string;
  emoji: string;
};

const OPTIONS: UnitOption[] = [
  { value: 'kg', label: 'Kilos (kg)', description: 'Estándar internacional.', emoji: '🌍' },
  { value: 'lb', label: 'Libras (lb)', description: 'Costumbre en EEUU/UK.', emoji: '🇺🇸' },
];

export default function OnboardingUnitScreen() {
  const { user: repo } = useRepos();

  const [selected, setSelected] = useState<Unit>('kg');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOrCreateProfile(repo).then((result) => {
      if (!cancelled && result.ok) {
        const p = result.value;
        if (UNITS.includes(p.unit)) setSelected(p.unit);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  const handleContinue = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const result = await updateProfile(repo, { unit: selected });
      if (!result.ok) throw result.error;
      router.push('/body');
    } catch (err) {
      console.error('[onboarding/unit] save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingShell
      step={4}
      totalSteps={6}
      title="¿Cómo lo ves tú?"
      subtitle="Solo cambia cómo se muestra. Internamente guardamos en kg."
      footer={
        <Button icon={ArrowRight} onPress={handleContinue} disabled={saving}>
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
            emoji={opt.emoji}
            active={selected === opt.value}
            onPress={() => setSelected(opt.value)}
          />
        ))}
      </View>
    </OnboardingShell>
  );
}
