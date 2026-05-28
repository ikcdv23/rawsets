import { TabBar } from '@/components/layout/tab-bar';
import { Tabs } from 'expo-router';

// Este archivo es SOLO configuración de routing (las pestañas).
// No pinta UI (títulos, etc.): eso va dentro de cada pantalla.
export default function WorkspaceLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="routines" />
      <Tabs.Screen name="body" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
