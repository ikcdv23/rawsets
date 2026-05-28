import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, router } from 'expo-router';
import { ChevronLeft, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    // TODO: enviar enlace de recuperación (Fase 2).
    // Por ahora vuelve a login.
    router.replace('/login');
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, padding: 28, paddingTop: 60 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Back button — pantalla apilada sobre login. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={() => router.back()}
        className="mb-4 h-[38px] w-[38px] items-center justify-center rounded-full border border-border bg-surface active:opacity-80"
      >
        <ChevronLeft color="#8A8A8A" size={18} strokeWidth={2.6} />
      </Pressable>

      <Text className="mb-1.5 font-sans-black text-[26px] tracking-[-0.9px] text-foreground">
        Recuperar acceso
      </Text>
      <Text className="mb-6 font-sans-medium text-[13px] leading-[19px] text-muted">
        Te enviamos un enlace para restablecer tu contraseña.
      </Text>

      <Input
        label="Email"
        type="email"
        placeholder="tu@email.com"
        leftIcon={Mail}
        value={email}
        onChangeText={setEmail}
      />

      <View className="mt-6">
        <Button onPress={handleSubmit}>Enviar enlace</Button>
      </View>

      <View className="mt-auto flex-row justify-center pt-8">
        <Text className="font-sans-medium text-[13px] text-muted">¿Lo recordaste? </Text>
        <Link href="/login" replace>
          <Text className="font-sans-black text-[13px] text-primary">Volver a entrar</Text>
        </Link>
      </View>
    </ScrollView>
  );
}
