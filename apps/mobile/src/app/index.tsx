import { Redirect } from 'expo-router';

// Root route. Redirige al primer tab del workspace.
// Cuando metamos auth o landing pública (Fase 2), aquí va la lógica
// condicional (logged-in → /home, web → /landing, etc.).
export default function Root() {
  return <Redirect href="/home" />;
}
