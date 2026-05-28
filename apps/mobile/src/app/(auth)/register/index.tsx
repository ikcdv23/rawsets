import { BrandMark } from '@/components/ui/brand-mark';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { GoogleIcon } from '@/components/ui/icons/google-icon';
import { Input } from '@/components/ui/input';
import { SocialButton } from '@/components/ui/social-button';
import { Link, router } from 'expo-router';
import { Apple, Lock, Mail, User } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    // TODO: integrar auth real + crear UserProfile inicial (ADR-0005).
    // TODO: tras registro, redirigir a onboarding (capturar bodyWeight, goal, etc.).
    // Por ahora, salta directo a Home.
    router.replace('/home');
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, padding: 28, paddingTop: 60 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-7 items-center">
        <BrandMark />
        <Text className="mt-4 font-sans-black text-[22px] tracking-[0.5px] text-foreground">
          RAWSETS<Text className="text-primary">.</Text>
        </Text>
      </View>

      <Text className="mb-1.5 font-sans-black text-[26px] tracking-[-0.9px] text-foreground">
        Crea tu cuenta
      </Text>
      <Text className="mb-6 font-sans-medium text-[13px] leading-[19px] text-muted">
        Empieza a entrenar con análisis de balance muscular.
      </Text>

      <View className="gap-3.5">
        <Input
          label="Nombre"
          type="text"
          placeholder="Tu nombre"
          leftIcon={User}
          value={name}
          onChangeText={setName}
        />
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
          placeholder="Mínimo 8 caracteres"
          leftIcon={Lock}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View className="mt-6">
        <Button onPress={handleRegister}>Crear cuenta</Button>
      </View>

      <View className="my-6">
        <Divider label="o regístrate con" />
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

      <View className="mt-auto flex-row justify-center pt-8">
        <Text className="font-sans-medium text-[13px] text-muted">¿Ya tienes cuenta? </Text>
        <Link href="/login" replace>
          <Text className="font-sans-black text-[13px] text-primary">Entrar</Text>
        </Link>
      </View>
    </ScrollView>
  );
}
