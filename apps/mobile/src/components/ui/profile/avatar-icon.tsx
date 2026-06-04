import { useDb } from '@/db/db-provider';
import { DrizzleSqliteUserProfileRepo } from '@/features/user/adapters/drizzle-sqlite-user-profile-repo';
import { initialsFromName } from '@/features/user/domain/user-profile';
import { getOrCreateProfile } from '@/features/user/use-cases/get-or-create-profile';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text } from 'react-native';

// AvatarIcon — círculo con iniciales derivadas del displayName del perfil.
// Sin foto aún (Fase 2): cuando la haya, cambiar el <Text> por
// <Image source={{ uri }} className="h-10 w-10 rounded-full" />.
//
// Por qué leer aquí en vez de recibir initials por prop:
//   - Aparece en MUCHAS pantallas (home, routines, settings, stats...).
//   - Cada pantalla tendría que cargar el perfil solo para pasarle el prop.
//   - El UserProfile es singleton — coste de un SELECT es ridículo.
//   - useFocusEffect recarga cuando vuelves a una pantalla → el avatar se
//     actualiza solo si cambias el nombre en Settings y vuelves a Home.
export function AvatarIcon() {
  const { db, sqlite } = useDb();
  const repo = useMemo(() => new DrizzleSqliteUserProfileRepo(db, sqlite), [db, sqlite]);
  const [initials, setInitials] = useState('?');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getOrCreateProfile(repo).then((p) => {
        if (!cancelled) setInitials(initialsFromName(p.displayName));
      });
      return () => {
        cancelled = true;
      };
    }, [repo]),
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Abrir perfil"
      onPress={() => router.push('/profile')}
      className="h-10 w-10 items-center justify-center rounded-full border border-border-strong bg-surface-2 active:opacity-80"
    >
      <Text className="font-sans-bold text-sm text-primary">{initials}</Text>
    </Pressable>
  );
}
