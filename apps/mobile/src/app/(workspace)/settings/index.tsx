import { Card } from '@/components/ui/card';
import { HeadTop } from '@/components/ui/head-top';
import { SectionHeader } from '@/components/ui/section-header';
import { router } from 'expo-router';
import { ChevronRight, User } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

// Ajustes — placeholder de Fase 1.
//
// Movido a /profile/edit: nombre, objetivo, unidad, peso corporal, sexo,
// fecha de nacimiento. La pantalla de Settings vuelve a su lugar natural:
// preferencias de APLICACIÓN (notificaciones, tema, idioma, integraciones),
// no datos personales.
//
// En Fase 1 no hay ninguna preferencia de app real todavía, así que esta
// pantalla muestra:
//   - Un acceso directo a "Editar perfil" (atajo útil — el avatar también
//     lleva ahí, pero este atajo deja el patrón claro).
//   - Placeholders honestos de lo que vendrá.
//
// Cuando llegue una preferencia real (push notifications, tema, etc.),
// reemplaza el placeholder por el card real. Sin necesidad de re-estructurar.
export default function SettingsScreen() {
  return (
    <View className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-3 px-6 pb-32 pt-8">
          <HeadTop title="Ajustes" />

          <SectionHeader>Tu perfil</SectionHeader>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/profile/edit')}
            className="flex-row items-center gap-4 rounded-2xl border border-border-strong bg-surface px-5 py-4 active:opacity-80"
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(168, 224, 85, 0.12)' }}
            >
              <User color="#A8E055" size={18} strokeWidth={2.4} />
            </View>
            <View className="flex-1">
              <Text className="font-sans-bold text-[14px] text-foreground">Editar perfil</Text>
              <Text className="mt-0.5 font-sans text-[11px] text-muted">
                Nombre, objetivo, peso, edad…
              </Text>
            </View>
            <ChevronRight color="#4A4A4A" size={18} strokeWidth={2.4} />
          </Pressable>

          <SectionHeader>Preferencias de app</SectionHeader>
          <Card>
            <Text className="font-sans-bold text-[12px] text-foreground">📋 Próximamente</Text>
            <Text className="mt-1.5 font-sans text-[12px] leading-[18px] text-muted">
              Notificaciones, tema oscuro/claro y recordatorios llegarán en próximas versiones.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
