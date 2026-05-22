// TODO: implement custom tab bar (pill flotante morada + FAB central).
// Recibirá props desde expo-router vía el prop `tabBar` en
// (workspace)/_layout.tsx. Brief detallado en la sesión F1.6.
//
// Cuando lo implementemos de verdad, importamos el tipo desde expo-router
// (en SDK 56 los tipos de bottom-tabs están embebidos en expo-router).
// Por ahora un type local mínimo para evitar el import inestable.

import { View } from 'react-native';

type TabBarPlaceholderProps = {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  navigation: { navigate: (name: string) => void };
};

export function TabBar(_props: TabBarPlaceholderProps) {
  return <View />;
}
