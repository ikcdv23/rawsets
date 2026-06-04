import { Stack } from 'expo-router';

// Route group del onboarding. Sin tab bar, sin chrome de workspace. Stack
// limpio con transición horizontal entre pasos — la "memoria muscular" de
// onboardings tipo iOS/Hevy.
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // slide_from_right: nativo en iOS, fade-slide en Android y web.
        // Si más adelante quieres algo más exótico (parallax, scale crossfade),
        // se puede pasar `animation: 'fade'` y montar la animación a mano con
        // Reanimated. Para v1 con esto basta.
        animation: 'slide_from_right',
        animationDuration: 280,
        gestureEnabled: true,
        contentStyle: { backgroundColor: '#0A0A0A' },
      }}
    />
  );
}
