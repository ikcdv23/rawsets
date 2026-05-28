# 0007 — Auth: Supabase + Google OAuth

- **Status**: Accepted (implementación diferida)
- **Fecha**: 2026-05-28
- **Deciders**: Javier (decisión final) + Claude (sparring)

> **Nota de implementación**: la decisión arquitectónica está cerrada (Supabase + Google), pero el cableado se difiere hasta que la app esté más madura. Trigger natural para retomarlo: cuando llegue el momento de enseñar RAWSETS a usuarios externos a Javier o cuando aparezca el deseo de sync entre dispositivos (Fase 2). Hasta entonces, los botones de auth social siguen como stubs visuales.

## Contexto

Las pantallas de auth ([login](../../apps/mobile/src/app/(auth)/login/index.tsx), [register](../../apps/mobile/src/app/(auth)/register/index.tsx), [forgot](../../apps/mobile/src/app/(auth)/forgot/index.tsx)) ya están construidas siguiendo el mockup. Falta cablear la lógica real de autenticación. Decisión:

1. ¿Qué proveedor de identidad usamos?
2. ¿Necesitamos backend propio o nos apoyamos en un BaaS?
3. ¿Email/password + social, o solo social?

Constricciones declaradas en [[project-rawsets-no-paid-services]]: **Fase 1 sin servicios de pago**. Esto descarta cualquier opción que obligue a contratar email transaccional (SendGrid / Mailgun / SES) para verificación de cuenta o reset de contraseña.

## Decision drivers

- **D1. Cero coste recurrente** en Fase 1. Cualquier proveedor debe tener plan gratis suficiente para uso personal + early adopters.
- **D2. No gestionar email infra propio**. Verificación de cuenta, password reset, etc., no debe obligarnos a integrar SendGrid o equivalente.
- **D3. Compatible con local-first**. La app debe seguir funcionando offline. Auth no debe gatillar funcionalidad esencial — sirve para identificar al usuario, no para bloquear el acceso a datos locales.
- **D4. Foreshadowing Fase 2 (sync)**. Aunque hoy la app es local-only, el proveedor elegido debe permitir añadir sync de datos sin migrar todo el stack auth.
- **D5. Compatible con Expo SDK 56 + RN 0.85 + web** (PWA-ready desde día 1 — ver [ADR-0001](0001-arquitectura.md)).
- **D6. Aprendizaje**. Patrón estándar de la industria (OAuth + BaaS), no invenciones.

## Alternativas consideradas

### A. Email/password propio + email transaccional contratado
- **Pros**: control total, sin dependencia de OAuth de terceros.
- **Contras**: hashing propio + secrets + flow de verify/reset + **paga SendGrid / Mailgun**. Choca con D1+D2.
- ❌ Descartado.

### B. Local-only fake auth (sin backend)
- **Pros**: cero infraestructura, cero coste, cero complicación.
- **Contras**: el "login" es cosmético. No identifica al usuario de forma real, no prepara nada para Fase 2 (sync). La inversión en setup OAuth se desperdicia.
- ❌ Descartado, aunque era opción válida si el objetivo fuera puro aprendizaje de UI.

### C. Firebase Auth + Google provider
- **Pros**: gratis ilimitado para auth, maduro, RN-friendly, integración con Google natural.
- **Contras**: si en Fase 2 queremos sync, su DB nativa es Firestore (NoSQL), que **no encaja con Drizzle** ni con el modelo relacional de los [ADR-0002 a 0006]. Forzaría duplicar capa de persistencia o migrar a otro stack.
- ❌ Descartado por D4 — no prepara la siguiente fase.

### D. Supabase Auth + Google provider — **ELEGIDA**
- **Pros**:
  - Plan gratis: **50k MAU**, ilimitados sign-ins, Postgres incluido. Sobra para años en uso personal.
  - **Postgres backend**: cuando llegue Fase 2 (sync), las tablas ya están en el mismo proveedor — solo conectamos Drizzle a Supabase Postgres y vamos.
  - **Email infra incluida** en su tier gratis (verify/reset): no contratamos SendGrid.
  - **Google OAuth + email/password** soportados out-of-box. Cubre el mockup completo.
  - Buena integración con Expo + web vía `@supabase/supabase-js`.
- **Contras**:
  - Setup inicial manual (proyecto Supabase + Google Cloud OAuth) — ~25 min.
  - Vendor lock-in moderado. Aceptable porque el dominio vive en TypeScript puro (ADR-0001), portable.

### E. Clerk + Google provider
- **Pros**: UX pre-hecha muy pulida, free tier 10k MAU.
- **Contras**: opinionated (su UI), no aporta DB para Fase 2, lock-in más fuerte.
- ❌ Descartado por D4 + estilo más cerrado.

## Decisión

**Supabase Auth con Google como provider principal + email/password como secundario.**

- **Fase 1**: solo Google sign-in operativo (sin emails). Email/password queda con UI hecha pero sin backend cableado (el formulario funciona localmente con datos mock).
- **Fase 2**: email/password se enchufa a Supabase Auth cuando lleguen los flows de verify/reset.

Cubre los drivers:
- D1 ✅ (50k MAU gratis), D2 ✅ (Google verifica; Supabase manda los pocos emails de auth que haga falta), D3 ✅ (datos locales no dependen del session), D4 ✅ (Postgres listo para sync), D5 ✅ (`@supabase/supabase-js` funciona en Expo + web), D6 ✅ (OAuth + BaaS estándar).

## Consecuencias

**Positivas:**
- Infraestructura para Fase 2 (sync) ya provisionada al activar el plan gratis.
- Cero coste recurrente.
- El UserProfile (ADR-0005) puede enlazarse con la sesión Supabase usando `supabaseUserId` como columna opcional. Si está null = sesión local-only; si tiene valor = vinculado a cuenta cloud.
- Apple sign-in queda como TODO Fase 2 (requiere asset oficial; ver mockup discusión 2026-05-28). El botón visible queda como "Coming soon" o se oculta.

**Negativas / aceptadas:**
- Dependencia de Supabase como vendor. Si suben precios o cierran, hay que migrar. Mitigado: el dominio es portable (TypeScript puro), solo cambiaríamos adapters.
- Setup inicial requiere acción manual de Javier (proyecto Supabase + OAuth en Google Cloud).
- Emails de auth se envían desde el dominio default de Supabase (no `@rawsets.app`). En Fase 2 cuando haya dominio propio se puede configurar SMTP custom (gratis), pero no es urgente.

**Riesgos / a vigilar:**
- Si activamos email/password real con verify, hay límite de 4 emails/hora en el plan gratis para uso transaccional. Suficiente para dev/lanzamiento mini; revisar si llegamos a escala.
- Token de Supabase guardado en `expo-secure-store`. Si el usuario reinstala la app, debe volver a loguearse — esto **es deseable** y match con el modelo local-first (datos locales se pierden al reinstalar igualmente hasta que llegue sync).

## Implementación esperada

**Setup manual (responsabilidad de Javier):**
1. Crear proyecto Supabase (free tier).
2. Crear OAuth Client en Google Cloud Console (Web application type).
3. Configurar el provider Google en Supabase con Client ID/Secret de Google.
4. Confirmar callback URL coincide en ambos lados.

**Setup código (Claude tras recibir credenciales):**
1. Instalar `@supabase/supabase-js` + `expo-auth-session` + `expo-web-browser` + `expo-secure-store`.
2. Crear cliente Supabase en `apps/mobile/src/features/auth/adapters/supabase-client.ts`.
3. Configurar `scheme` en `app.json` para el deep link de callback (ej. `rawsets://auth/callback`).
4. Implementar `signInWithGoogle()` y `signOut()` en `features/auth/domain/` (funciones puras envueltas en adapter).
5. Cablear botones Google de [login](../../apps/mobile/src/app/(auth)/login/index.tsx) y [register](../../apps/mobile/src/app/(auth)/register/index.tsx) al flow.
6. Wrapping del root `_layout.tsx` con un listener de sesión: si hay sesión → permite acceso a `(workspace)`; si no → redirige a `(auth)/login`.
7. Crear/actualizar la fila singleton de `user_profile` (ADR-0005) al primer login exitoso.

**Variables de entorno**:
- `EXPO_PUBLIC_SUPABASE_URL` — la URL del proyecto.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — la clave pública. Va en `.env` (gitignored), nunca commiteada.

**Cambios en otros ADRs**:
- ADR-0005 (UserProfile): añadir columna opcional `supabaseUserId: text?` que enlaza la fila local con la sesión cloud. Mantener `id='me'` como PK del singleton local.
