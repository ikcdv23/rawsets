import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeader } from '@/components/ui/section-header';
import { useRepos } from '@/db/repo-provider';
import {
  GOALS,
  type Goal,
  SEXES,
  type Sex,
  UNITS,
  type Unit,
} from '@/features/user/domain/user-profile';
import { SelectCard } from '@/features/user/ui/onboarding/select-card';
import { getOrCreateProfile } from '@/features/user/use-cases/get-or-create-profile';
import { updateProfile } from '@/features/user/use-cases/update-profile';
import { safeBack } from '@/lib/safe-back';
import {
  Asterisk,
  ChevronLeft,
  Dumbbell,
  Equal,
  Flame,
  Leaf,
  type LucideIcon,
  Mars,
  Venus,
  Zap,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

// Labels + visual leading. Goal y sex usan iconos lucide (registro
// elegante). Unit usa emojis: el contexto es regional/cultural (estándar
// internacional vs. costumbre EEUU), y un globo/bandera comunica mejor
// que cualquier icono geométrico.
type IconOption<T extends string> = {
  value: T;
  label: string;
  description: string;
  icon: LucideIcon;
};

type EmojiOption<T extends string> = {
  value: T;
  label: string;
  description: string;
  emoji: string;
};

const GOAL_OPTIONS: IconOption<Goal>[] = [
  { value: 'mass', label: 'Subir masa', description: 'Hipertrofia y volumen', icon: Dumbbell },
  { value: 'strength', label: 'Fuerza', description: 'Cargas altas, baja reps', icon: Zap },
  { value: 'loss', label: 'Bajar grasa', description: 'Definición y déficit', icon: Flame },
  {
    value: 'maintenance',
    label: 'Mantenimiento',
    description: 'Mantener lo conseguido',
    icon: Equal,
  },
  {
    value: 'general',
    label: 'Vida sana',
    description: 'Estar activo, sin objetivo concreto',
    icon: Leaf,
  },
];

const UNIT_OPTIONS: EmojiOption<Unit>[] = [
  { value: 'kg', label: 'Kilos (kg)', description: 'Estándar internacional', emoji: '🌍' },
  { value: 'lb', label: 'Libras (lb)', description: 'Costumbre en EEUU/UK', emoji: '🇺🇸' },
];

const SEX_OPTIONS: IconOption<Sex>[] = [
  { value: 'male', label: 'Hombre', description: '', icon: Mars },
  { value: 'female', label: 'Mujer', description: '', icon: Venus },
  { value: 'other', label: 'Otro / prefiero no decirlo', description: '', icon: Asterisk },
];

// Las listas de IDs siguen viniendo del dominio (GOALS/UNITS/SEXES) — los
// Options de arriba están alineados con esos arrays pero añaden display.

// Profile edit — formulario único con TODOS los campos del UserProfile.
//
// Decisión de UX: en vez de seis modales (uno por campo) o seis screens,
// una sola pantalla scrollable con el form completo. Razón:
//   - El usuario ya está en "modo editar"; cambiar varios campos seguidos
//     debería ser una sesión, no seis interacciones modales.
//   - Code path simple: un único `updateProfile` con el patch final.
//   - Lectura coherente con el onboarding (mismos componentes, mismas
//     decisiones visuales).
//
// Persistencia: solo se escribe al pulsar "Guardar". Si el usuario sale
// sin guardar (back o cancelar), nada cambia — diferencia clave con el
// onboarding que persiste paso a paso.
export default function ProfileEditScreen() {
  const { user: repo } = useRepos();

  // Form state — local hasta que el usuario decida guardar.
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [goal, setGoal] = useState<Goal>('general');
  const [unit, setUnit] = useState<Unit>('kg');
  const [bodyWeight, setBodyWeight] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');

  // Cargar el perfil al montar.
  useEffect(() => {
    let cancelled = false;
    getOrCreateProfile(repo).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        const p = result.value;
        setDisplayName(p.displayName ?? '');
        if (GOALS.includes(p.goal)) setGoal(p.goal);
        if (UNITS.includes(p.unit)) setUnit(p.unit);
        // Mostramos el peso en la unidad guardada (kg internamente).
        if (p.bodyWeight !== null) {
          const display = p.unit === 'lb' ? p.bodyWeight * 2.20462 : p.bodyWeight;
          setBodyWeight(display.toFixed(1).replace(/\.0$/, ''));
        }
        if (p.sex && SEXES.includes(p.sex)) setSex(p.sex);
        if (p.birthDate) {
          setBirthDay(String(p.birthDate.getDate()));
          setBirthMonth(String(p.birthDate.getMonth() + 1));
          setBirthYear(String(p.birthDate.getFullYear()));
        }
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const patch: Parameters<typeof updateProfile>[1] = {};

      // displayName: trim, vacío → null (el use case ya lo limpia, pero lo
      // hacemos aquí también para evitar viajes innecesarios).
      const nameTrimmed = displayName.trim();
      patch.displayName = nameTrimmed.length > 0 ? nameTrimmed : null;

      patch.goal = goal;
      patch.unit = unit;
      patch.sex = sex;

      // bodyWeight: parseamos y convertimos a kg si la unidad es lb.
      if (bodyWeight.trim()) {
        const parsed = Number.parseFloat(bodyWeight.replace(',', '.'));
        if (Number.isFinite(parsed) && parsed > 0) {
          patch.bodyWeight = unit === 'lb' ? Number((parsed * 0.453592).toFixed(2)) : parsed;
        }
      } else {
        patch.bodyWeight = null;
      }

      // birthDate: solo si los 3 campos están rellenos y son válidos.
      const d = Number.parseInt(birthDay, 10);
      const m = Number.parseInt(birthMonth, 10);
      const y = Number.parseInt(birthYear, 10);
      if (
        Number.isFinite(d) &&
        Number.isFinite(m) &&
        Number.isFinite(y) &&
        d >= 1 &&
        d <= 31 &&
        m >= 1 &&
        m <= 12 &&
        y >= 1900 &&
        y <= new Date().getFullYear()
      ) {
        const date = new Date(y, m - 1, d);
        // Validación: que el día exista (e.g. 31 de febrero no).
        if (date.getDate() === d && date.getMonth() === m - 1) {
          patch.birthDate = date;
        } else {
          patch.birthDate = null;
        }
      } else if (!birthDay && !birthMonth && !birthYear) {
        // Los tres vacíos → explicit null.
        patch.birthDate = null;
      }
      // Si solo algunos vacíos, NO seteamos birthDate — el usuario sigue
      // editando y no queremos sobreescribir con un valor inválido.

      const result = await updateProfile(repo, patch);
      if (!result.ok) throw result.error;

      safeBack('/profile');
    } catch (err) {
      console.error('[profile/edit] save error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="font-sans text-muted">Cargando…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-8">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancelar"
            onPress={() => safeBack('/profile')}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full border border-border-strong bg-surface active:opacity-70"
          >
            <ChevronLeft color="#FAFAFA" size={20} strokeWidth={2.4} />
          </Pressable>
          <Text className="font-sans-black text-[18px] tracking-[-0.5px] text-foreground">
            Editar perfil
          </Text>
          <View className="h-10 w-10" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="px-6 pb-32 pt-6">
            {/* Nombre */}
            <SectionHeader>Identidad</SectionHeader>
            <Input
              label="Nombre"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Tu nombre"
              autoCapitalize="words"
            />

            {/* Fecha de nacimiento */}
            <View className="mt-5">
              <Text className="mb-2 font-sans-bold text-[10px] uppercase tracking-[1.5px] text-muted">
                Fecha de nacimiento
              </Text>
              <View className="flex-row gap-3">
                <DateInput
                  value={birthDay}
                  onChangeText={setBirthDay}
                  placeholder="DD"
                  maxLength={2}
                />
                <DateInput
                  value={birthMonth}
                  onChangeText={setBirthMonth}
                  placeholder="MM"
                  maxLength={2}
                />
                <DateInput
                  value={birthYear}
                  onChangeText={setBirthYear}
                  placeholder="AAAA"
                  maxLength={4}
                  flex={2}
                />
              </View>
            </View>

            {/* Sexo */}
            <SectionHeader>Sexo</SectionHeader>
            <View className="gap-2">
              {SEX_OPTIONS.map((opt) => (
                <SelectCard
                  key={opt.value}
                  label={opt.label}
                  icon={opt.icon}
                  active={sex === opt.value}
                  onPress={() => setSex(sex === opt.value ? null : opt.value)}
                />
              ))}
            </View>

            {/* Objetivo */}
            <SectionHeader>Objetivo</SectionHeader>
            <View className="gap-2">
              {GOAL_OPTIONS.map((opt) => (
                <SelectCard
                  key={opt.value}
                  label={opt.label}
                  description={opt.description}
                  icon={opt.icon}
                  active={goal === opt.value}
                  onPress={() => setGoal(opt.value)}
                />
              ))}
            </View>

            {/* Unidad */}
            <SectionHeader>Unidad</SectionHeader>
            <View className="gap-2">
              {UNIT_OPTIONS.map((opt) => (
                <SelectCard
                  key={opt.value}
                  label={opt.label}
                  description={opt.description}
                  emoji={opt.emoji}
                  active={unit === opt.value}
                  onPress={() => setUnit(opt.value)}
                />
              ))}
            </View>

            {/* Peso corporal */}
            <View className="mt-6">
              <Input
                label={`Peso corporal (${unit})`}
                value={bodyWeight}
                onChangeText={setBodyWeight}
                placeholder={unit === 'kg' ? '75' : '165'}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer fijo con CTA */}
        <View className="border-t border-border bg-background px-6 pb-8 pt-4">
          <Button onPress={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

// Input numérico cuadrado tipo "casillero", para los segmentos de fecha.
// No reutilizo el `Input` porque el `Input` envuelve en una caja con padding
// y label — aquí queremos rectángulos simples del mismo tamaño en row.
function DateInput({
  value,
  onChangeText,
  placeholder,
  maxLength,
  flex = 1,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  maxLength: number;
  flex?: number;
}) {
  return (
    <View style={{ flex }} className="rounded-2xl border border-border-strong bg-surface px-4">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#4A4A4A"
        keyboardType="number-pad"
        maxLength={maxLength}
        className="py-4 text-center font-mono-bold text-base text-foreground"
      />
    </View>
  );
}
