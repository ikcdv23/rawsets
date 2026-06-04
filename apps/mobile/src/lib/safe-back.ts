import { router } from 'expo-router';

// Back "defensivo": si hay history en el stack, navega atrás. Si no
// (típicamente porque el usuario hizo recarga en una pantalla profunda,
// hot reload reinició el stack, o llegó por deep link directo), redirige
// al `fallback` indicado.
//
// Por qué existe esta función:
//   `router.back()` lanza warning en dev y a veces no-op en prod cuando
//   no hay screen al que volver. El error es:
//     "The action 'GO_BACK' was not handled by any navigator."
//   Esto se ve en cualquier app que tiene back buttons que asumen historia.
//
// Uso:
//   onPress={() => safeBack('/home')}
//
// El fallback debe ser una ruta REPLACE-segura — no quieres acumular el
// fallback en el stack. Por eso usamos `replace`, no `push`.
export function safeBack(fallback: string): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    // biome-ignore lint/suspicious/noExplicitAny: expo-router types Href como string literal del filesystem; aceptamos string genérico aquí.
    router.replace(fallback as any);
  }
}
