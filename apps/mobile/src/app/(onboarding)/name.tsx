import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDb } from '@/db/db-provider';
import { DrizzleSqliteUserProfileRepo } from '@/features/user/adapters/drizzle-sqlite-user-profile-repo';
import { OnboardingShell } from '@/features/user/ui/onboarding/onboarding-shell';
import { getOrCreateProfile } from '@/features/user/use-cases/get-or-create-profile';
import { updateProfile } from '@/features/user/use-cases/update-profile';
import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';

// Step 1 — Nombre. Único campo obligatorio (lo usamos para las iniciales del
// avatar y para saludar).
export default function OnboardingNameScreen() {
  const { db, sqlite } = useDb();
  const repo = useMemo(() => new DrizzleSqliteUserProfileRepo(db, sqlite), [db, sqlite]);

  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  // Pre-rellena si el usuario ya pasó por aquí y vuelve atrás.
  useEffect(() => {
    let cancelled = false;
    getOrCreateProfile(repo).then((p) => {
      if (!cancelled && p.displayName) setName(p.displayName);
    });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  const trimmed = name.trim();
  const canContinue = trimmed.length > 0 && !saving;

  const handleContinue = async () => {
    if (!canContinue) return;
    setSaving(true);
    try {
      await updateProfile(repo, { displayName: trimmed });
      router.push('/goal');
    } catch (err) {
      console.error('[onboarding/name] save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingShell
      step={2}
      totalSteps={6}
      title="¿Cómo te llamas?"
      subtitle="Lo usamos en saludos y para tus iniciales en el avatar."
      footer={
        <Button icon={ArrowRight} onPress={handleContinue} disabled={!canContinue}>
          Continuar
        </Button>
      }
    >
      <Input
        label="Nombre"
        value={name}
        onChangeText={setName}
        placeholder="Javier"
        autoFocus
        returnKeyType="next"
        onSubmitEditing={handleContinue}
      />
    </OnboardingShell>
  );
}
