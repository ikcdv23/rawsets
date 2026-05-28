import { BrandMark } from '@/components/ui/brand-mark';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { GoogleIcon } from '@/components/ui/icons/google-icon';
import { Input } from '@/components/ui/input';
import { SocialButton } from '@/components/ui/social-button';
import { Link, router } from 'expo-router';
import { Apple, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

export default function LoginScreen() {
  // Controlled inputs.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // TODO: integrar auth real (Fase 2: Supabase / Firebase / etc.).
    router.replace('/home');
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, padding: 28, paddingTop: 60 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Brand hero: marca (R lima) + wordmark debajo. */}
      <View className="mb-7 items-center">
        <BrandMark />
        <Text className="mt-4 font-sans-black text-[22px] tracking-[0.5px] text-foreground">
          RAWSETS<Text className="text-primary">.</Text>
        </Text>
      </View>

      {/* Título + subtítulo del view. */}
      <Text className="mb-1.5 font-sans-black text-[26px] tracking-[-0.9px] text-foreground">
        Bienvenido de vuelta
      </Text>
      <Text className="mb-6 font-sans-medium text-[13px] leading-[19px] text-muted">
        Entra para seguir registrando tu progreso.
      </Text>

      {/* Form. */}
      <View className="gap-3.5">
        <Input
          label="Email"
          type="email"
          placeholder="tu@email.com"
          leftIcon={Mail}
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          leftIcon={Lock}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {/* "¿Olvidaste tu contraseña?" — alineado a la derecha. */}
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push('/forgot')}
        className="mt-3 mb-5 self-end active:opacity-70"
        hitSlop={8}
      >
        <Text className="font-sans-bold text-[12px] text-primary">¿Olvidaste tu contraseña?</Text>
      </Pressable>

      <Button onPress={handleLogin}>Entrar</Button>

      <View className="my-6">
        <Divider label="o continúa con" />
      </View>

      <View className="flex-row gap-3">
        <SocialButton
          icon={<Apple color="#FAFAFA" size={18} fill="#FAFAFA" strokeWidth={0} />}
          label="Apple"
          onPress={() => {
            // TODO: auth social Apple (Fase 2).
          }}
        />
        <SocialButton
          icon={<GoogleIcon />}
          label="Google"
          onPress={() => {
            // TODO: auth social Google (Fase 2).
          }}
        />
      </View>

      {/* Footer: link a register. */}
      <View className="mt-auto flex-row justify-center pt-8">
        <Text className="font-sans-medium text-[13px] text-muted">¿No tienes cuenta? </Text>
        <Link href="/register" replace>
          <Text className="font-sans-black text-[13px] text-primary">Crear cuenta</Text>
        </Link>
      </View>
    </ScrollView>
  );
}
