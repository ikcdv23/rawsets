import { TabBar } from '@/components/layout/tab-bar';
import { Tabs } from 'expo-router';

// Este archivo es SOLO configuración de routing (las pestañas).
// No pinta UI (títulos, etc.): eso va dentro de cada pantalla.
//
// El WorkoutSessionProvider y WorkoutSheet viven en el _layout raíz para que
// el sheet pueda flotar por encima de todo el árbol (auth, workspace, modals).
// La TabBar consume el context (importa el hook directamente).
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
