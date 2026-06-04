import { useDb } from '@/db/db-provider';
import { DrizzleSqliteUserProfileRepo } from '@/features/user/adapters/drizzle-sqlite-user-profile-repo';
import { isOnboarded } from '@/features/user/domain/user-profile';
import { getOrCreateProfile } from '@/features/user/use-cases/get-or-create-profile';
import { Redirect } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

// Root route. Lee el perfil y decide:
//   - onboarded → /home (workspace)
//   - sin onboarding → /welcome (route group de onboarding)
//
// Por qué aquí y no en _layout: este componente vive DENTRO de <DbProvider>
// (el layout lo envuelve), así que tenemos `useDb()` disponible. Hacer la
// decisión en el layout requeriría exponer el bundle más arriba y complica
// la dependencia. Mejor mantenerla en el "router endpoint" y dejarle al
// layout su único trabajo: proveer la DB.
export default function Root() {
  const { db, sqlite } = useDb();
  const repo = useMemo(() => new DrizzleSqliteUserProfileRepo(db, sqlite), [db, sqlite]);

  const [target, setTarget] = useState<'/home' | '/welcome' | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOrCreateProfile(repo)
      .then((profile) => {
        if (cancelled) return;
        setTarget(isOnboarded(profile) ? '/home' : '/welcome');
      })
      .catch((err) => {
        console.error('[root] profile read error, defaulting to onboarding:', err);
        if (!cancelled) setTarget('/welcome');
      });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  // Pantalla "en blanco" sobre background mientras decidimos. Es instantáneo
  // (un SELECT en una sola fila) — el usuario no llega a verla.
  if (target === null) {
    return <View className="flex-1 bg-background" />;
  }

  return <Redirect href={target} />;
}
