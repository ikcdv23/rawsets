import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRepos } from '@/db/repo-provider';
import { SEXES, type Sex, type Unit } from '@/features/user/domain/user-profile';
import { OnboardingShell } from '@/features/user/ui/onboarding/onboarding-shell';
import { SelectCard } from '@/features/user/ui/onboarding/select-card';
import { getOrCreateProfile } from '@/features/user/use-cases/get-or-create-profile';
import { updateProfile } from '@/features/user/use-cases/update-profile';
import { router } from 'expo-router';
import { ArrowRight, Asterisk, type LucideIcon, Mars, Venus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

// Step 4 — Sobre ti (peso corporal + sexo). AMBOS opcionales pero recomendados.
// El usuario verá un "saltar" prominente; si rellena algo, se guarda y avanza.
//
// Decisión: ambos campos en una sola pantalla porque son del mismo tipo
// (biometría privada). Separarlos en dos pasos haría sentir "te están pidiendo
// muchos datos". Juntos suenan como un único compromiso pequeño.
type SexOption = {
  value: Sex;
  label: string;
  icon: LucideIcon;
};

const SEX_OPTIONS: SexOption[] = [
  { value: 'male', label: 'Hombre', icon: Mars },
  { value: 'female', label: 'Mujer', icon: Venus },
  { value: 'other', label: 'Otro / prefiero no decirlo', icon: Asterisk },
];

export default function OnboardingBodyScreen() {
  const { user: repo } = useRepos();

  const [weight, setWeight] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [unit, setUnit] = useState<Unit>('kg');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOrCreateProfile(repo).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        const p = result.value;
        setUnit(p.unit);
        if (p.bodyWeight !== null) setWeight(String(p.bodyWeight));
        if (p.sex && SEXES.includes(p.sex)) setSex(p.sex);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  const handleSubmit = async (skipFields: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      // Si saltamos, NO sobreescribimos los campos: dejamos como estaban.
      // Si rellenamos, escribimos solo los que tienen valor válido.
      if (!skipFields) {
        const parsed = weight.trim() ? Number.parseFloat(weight.replace(',', '.')) : null;
        const patch: Parameters<typeof updateProfile>[1] = {};
        if (parsed !== null && Number.isFinite(parsed) && parsed > 0) {
          // Si el usuario tiene unit=lb, convierto a kg antes de guardar
          // (la app trabaja siempre en kg internamente — ADR-0005).
          patch.bodyWeight = unit === 'lb' ? Number((parsed * 0.453592).toFixed(2)) : parsed;
        }
        if (sex) patch.sex = sex;
        if (Object.keys(patch).length > 0) {
          const result = await updateProfile(repo, patch);
          if (!result.ok) throw result.error;
        }
      }
      router.push('/done');
    } catch (err) {
      console.error('[onboarding/body] save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingShell
      step={5}
      totalSteps={6}
      title="Cuéntanos sobre ti"
      subtitle="Opcional. Pero con esto podremos sugerirte rutinas y métricas más precisas."
      footer={
        <View className="gap-3">
          <Button icon={ArrowRight} onPress={() => handleSubmit(false)} disabled={saving}>
            Continuar
          </Button>
          <Pressable
            accessibilityRole="button"
            onPress={() => handleSubmit(true)}
            disabled={saving}
            hitSlop={8}
            className="items-center py-2 active:opacity-60"
          >
            <Text className="font-sans-medium text-[13px] text-muted">Saltar de momento</Text>
          </Pressable>
        </View>
      }
    >
      <View className="gap-6">
        <Input
          label={`Peso corporal (${unit})`}
          value={weight}
          onChangeText={setWeight}
          placeholder={unit === 'kg' ? '75' : '165'}
          keyboardType="decimal-pad"
        />

        <View>
          <Text className="mb-2 font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
            Sexo
          </Text>
          <View className="gap-2">
            {SEX_OPTIONS.map((opt) => (
              <SelectCard
                key={opt.value}
                label={opt.label}
                icon={opt.icon}
                active={sex === opt.value}
                onPress={() => setSex(opt.value)}
              />
            ))}
          </View>
        </View>
      </View>
    </OnboardingShell>
  );
}
