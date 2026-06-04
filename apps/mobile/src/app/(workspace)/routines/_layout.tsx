import { Stack } from 'expo-router';

// Layout interno del tab "routines".
//
// Sin este Stack, expo-router trata `routines/index.tsx` y `routines/[id].tsx`
// como pantallas hermanas sin historial entre ellas. `router.back()` desde
// el detalle no encuentra pantalla previa y cae al primer tab (home).
//
// Con el Stack, cada `router.push("/routines/${id}")` apila correctamente,
// y `router.back()` pop'ea de vuelta a la lista. Comportamiento esperado
// en navegación móvil.
export default function RoutinesStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
