# RAWSETS — Ficha técnica inicial

> Documento vivo. Última actualización: 2026-05-22. Refleja el estado de las decisiones tras la sesión de discovery.

---

## 1. Resumen ejecutivo

**RAWSETS** es una aplicación móvil multiplataforma (iOS + Android) para registrar entrenamientos de gimnasio. Se diferencia de las apps de referencia (Hevy, Symmetry) por un foco explícito en **análisis de balance muscular** desde el primer momento.

- **Audiencia inicial**: el autor (Javier) + círculo cercano (amigos, posiblemente un entrenador).
- **Motivación primaria**: aprendizaje end-to-end (móvil + backend + DevOps + análisis de datos / ML).
- **Motivación secundaria**: dogfooding personal y exploración de una eventual idea de producto.
- **Benchmark de referencia**: Hevy cumple el rol de registro. Symmetry inspira el ángulo analítico.

## 2. Branding e identidad

- **Nombre**: RAWSETS (escritura "RAW" + "SETS" con énfasis tipográfico en SETS). Plural mantenido tras explorar singular: el visual del logo y la sonoridad del plural pesan más, y el plural conecta con la idea de "muchas series, sin maquillaje".
- **Tipografía del logo**: **dirección futurista display** (referencias: Anero, Blackbox, Sentex, Mayhem — pixel-fonts geométricas, angulares, cortes diagonales, sin curvas). Para body/UI: Inter (sans-serif). Para datos numéricos: JetBrains Mono. **Logo en exploración activa** en `DOCS/logo-explorations.html`.
- **Paleta** (definida vía Adobe Color, inspirada en [Arounda — Supporty](https://arounda.agency)):
  - `#6B21CF` **primary** — violeta, acento funcional principal (botones, FAB, nav).
  - `#B8FA82` **accent** — verde lima, **acento decorativo no semántico** (branding, ilustraciones, blobs). No representa "éxito/OK".
  - `#E11D48` **destructive** — rose-600, errores y desbalances del dashboard.
  - `#1F2937` **foreground** — slate, texto principal.
  - `#EDE9FE` **surface** — lavanda muy claro, cards y superficies elevadas.
  - **Fondo**: claro en Fase 1, oscuro en Fase 2 vía design tokens semánticos preparados desde día 1.
- **Referencia visual**: Arounda / Supporty — fondo oscuro dominante, acento violeta funcional, verde lima como "vitamina" decorativa.
- **Tono**: directo, técnico, sin gamificación infantil. Cero confetti, cero badges chillones.

## 3. Plataforma y distribución

### Plataforma
- **iOS + Android + Web** vía **Expo (React Native + Expo Web)**, TypeScript estricto.
- Single codebase compila a 3 targets desde día 1 (Plan B: PWA-ready).
- Sin Mac de desarrollo: iOS resuelto vía **EAS Build** + **Expo Go** en Fase 1.
- **Offline**: requisito "nice-to-have" — la app funciona aunque haya señal mala en el gym, sin ser una pieza crítica.
- **Estrategia de lanzamiento**: nativa en Google Play (Android) + PWA en iOS hasta acumular base de usuarios. Cuando justifique, se paga Apple Developer Program y sale nativa iOS.

### Distribución por fases
| Fase | Mecanismo | Coste |
|---|---|---|
| Fase 1 (alpha personal + círculo) | Expo Go (iOS y Android) + link de proyecto. Web compilable en local pero no desplegada. | 0 € |
| Fase 2 (público limitado) | **Google Play** (Android nativo) + **PWA iOS** instalable desde landing. Tipos compartidos. | $25 una vez (Google) |
| Fase 2+ / producción | + App Store (iOS nativo) cuando haya tracción. PWA pasa a fallback / web app secundaria. | + $99/año (Apple Dev) |

### Actualizaciones
- **EAS Update (OTA)** para todo cambio JS/TS y assets — distribución casi instantánea sin pasar por stores.
- **Binary updates** (rebuild + stores) solo cuando haya cambios nativos (nuevos paquetes, permisos, SDK major).

## 4. Stack técnico

### Móvil + Web (mismo codebase)
| Pieza | Elección |
|---|---|
| Framework | Expo SDK 56 + React Native 0.85 + Expo Web (react-native-web 0.21) |
| Lenguaje | TypeScript ~6.0 (strict, noUncheckedIndexedAccess) · React 19.2 |
| Targets | iOS, Android, Web (PWA) desde día 1 |
| Navegación | expo-router (file-based, web nativo soportado) |
| Estilos | NativeWind v4 con design tokens semánticos (funciona en los 3 targets) |
| BD local móvil | expo-sqlite + Drizzle ORM (driver expo-sqlite) |
| BD local web | **sqlite-wasm + Drizzle ORM** (driver web), persistencia vía OPFS o IndexedDB |
| Estado UI | Zustand |
| Forms | React Hook Form + Zod |
| Iconos | lucide-react-native (funciona en web) |
| Gráficos | Victory Native XL (decisión firme) |
| Humanoid muscle map | **react-native-body-highlighter** (MIT, Expo-compatible). SVG male/female front/back con 24 grupos musculares. Hero de la pantalla Body. API `data={[{slug, intensity, side}]}` mapea directo a los 11 grupos de RAWSETS (ver §6) + onPress para drill-down. Decidido 2026-05-26. |
| Tests | Vitest para lógica de dominio |
| Build/distrib. móvil | EAS Build, EAS Update |
| Build/distrib. web | Export web + hosting estático (Vercel o Cloudflare Pages en Fase 2) |

### Backend (Fase 2)
| Pieza | Elección preliminar |
|---|---|
| Framework | Hono + TypeScript en Node |
| BD | PostgreSQL + Drizzle (compartiendo schema con cliente) |
| Auth | Better Auth (preferido por aprendizaje) o Clerk (atajo) — a decidir |
| Hosting | Fly.io o Railway |
| Jobs/colas | Pendiente (probable BullMQ o equivalente, según necesidades reales) |

### Análisis / ML (Fase 3)
- Microservicio aparte en **Python** (FastAPI) consumiendo datos del backend principal.
- pandas + scikit-learn como base.

## 5. Arquitectura / estructura del repositorio

- **Monorepo plano con pnpm workspaces**. Sin Turborepo en Fase 1 (se evaluará en Fase 2/3 si la cache aporta valor).
- **Razón de elegir monorepo sobre polyrepo**: equipo de 1 persona, un lenguaje principal (TS), apps acopladas que comparten dominio. Polyrepo añadiría versionado de tipos y CI duplicado sin retorno educativo en esta fase.

```
rawsets/
├── apps/
│   ├── mobile/               # Expo app (Fase 1)
│   └── api/                  # Hono backend (Fase 2)
├── packages/
│   ├── domain/               # Tipos + lógica pura (Fase 1)
│   └── db/                   # Schema Drizzle compartido (Fase 2)
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── CLAUDE.md
```

**`packages/domain` desde Fase 1** porque:
- El cálculo de balance muscular y los tipos del dominio se reusan en backend sin coste.
- Permite tests puros del dominio sin levantar React Native (mucho más rápido).
- Enseña separación de capas, valor de portafolio.

## 6. Modelo de datos (esquema mental, Fase 1)

```
Exercise
  id, name, isCustom
  primaryMuscles:   [MuscleGroup]   # peso 1.0 en cálculo de balance
  secondaryMuscles: [MuscleGroup]   # peso 0.5

MuscleGroup (enum, 11 valores planos en Fase 1)
  pecho, espalda, hombro,
  biceps, triceps, antebrazo,
  cuadriceps, isquios, gluteo, pantorrilla,
  core

# Nota: granularidad simplificada en Fase 1 (YAGNI).
# La separación fina (hombro anterior/medio/posterior, espalda en dorsal/trapecio/lumbar, etc.)
# se revisará cuando el uso real revele qué imbalances merecen detección,
# con ADR + migración. Decisión tomada 2026-05-26.

Routine
  id, name, createdAt
  exercises: [RoutineExercise]   # ordenado

RoutineExercise
  exerciseId, position, targetSets, notes?

WorkoutSession
  id, routineId?, startedAt, finishedAt?, notes?

WorkoutSet
  id, sessionId, exerciseId, setNumber,
  weight, reps, rpe?, completed, restSeconds?
```

**Taxonomía de grupos en Fase 1**: 11 grupos planos (sin separación fina vs agrupada). La idea original de "12 finos + 6 agrupados" se simplificó por YAGNI — se evaluará retomarla cuando el uso real lo justifique (decisión 2026-05-26).

**Unidades**: kg por defecto, con switch a lb en settings desde el inicio.

## 7. Roadmap por fases

### Fase 1 — MVP móvil local + balance muscular (~6-10 semanas a ritmo side project)
- App móvil completa funcionando en iPhone (Expo Go) y Android (emulador / teléfono).
- **Disciplina Plan B**: la app compila también a web desde día 1 (probada en local). Sin desplegar todavía.
- Registro de rutinas y entrenamientos.
- **Dashboard de balance muscular** como feature diferenciadora.
- Todo local (SQLite en móvil, sqlite-wasm en web). Sin auth, sin sync, sin backend.
- Distribución: link de Expo Go al círculo cercano.

### Fase 2 — Backend + DevOps + rutinas compartidas + PWA pública
- Backend Hono + Postgres desplegado real.
- Auth + sync entre dispositivos.
- Feature B: rutinas compartidas (entrenador → atleta, o entre amigos).
- Modo oscuro activado (tokens ya preparados en Fase 1).
- Empieza CI/CD serio, Docker, observabilidad básica.
- **Landing pública con PWA instalable** (iOS y Android web). Nativa Android sube a Google Play.
- App Store iOS sigue fuera hasta que las métricas justifiquen pagar Apple Developer Program.

### Fase 3 — Análisis / ML
- Microservicio Python consumiendo datos reales acumulados.
- Detección de desbalances persistentes, estancamiento, recomendaciones.
- Posibles features: 1RM estimado, periodización sugerida, predicción de progreso.

## 8. Alcance de Fase 1

### Dentro
- **Catálogo de ejercicios**: ~40 precargados + creación de custom (asignando grupos primarios/secundarios).
- **Rutinas**: crear, editar, duplicar, borrar. Lista ordenada de ejercicios + sets objetivo + notas.
- **Sesión de entrenamiento**: iniciar desde rutina o vacía. Registro de peso/reps/RPE por set, cronómetro de descanso manual.
- **Historial**: lista de sesiones por semana, detalle de sesión.
- **Dashboard de balance muscular**: 11 grupos planos en Fase 1, rangos 7d/14d/mes, marcado de desbalances. Granularidad fina aplazada (ver §6).
- **Racha de días entrenando** (top-right).
- **Perfil local mínimo** (top-right): nombre, unidades, umbral de desbalance.
- **Settings**: tema (preparado pero solo claro activo), unidades, umbral.

### Fuera (Fase 2 o nunca)
- Backend, sync, cloud, multi-dispositivo.
- Auth, login, compartir.
- Notificaciones push.
- Sistema completo de logros / gamificación.
- Periodización, mesociclos, planes inteligentes.
- Importar/exportar (Hevy, Strong, Apple Health, Google Fit, wearables).
- Peso corporal, fotos progreso, nutrición.
- Gráficos de progresión por ejercicio (1RM estimado, etc.) — posiblemente Fase 1.5 si sobra tiempo.
- Sugerencias automáticas / ML.
- Modo entrenador / asignar rutinas a otros.
- Múltiples idiomas (solo español).
- Modo oscuro activo (tokens listos, paleta a definir en Fase 2).

## 9. UX / UI

### Navegación
- **Tab bar inferior píldora flotante con glassmorphism** (`backdrop-filter: blur` + `bg rgba(14,14,14,0.72)`), separada de los bordes del teléfono.
- **4 tabs**: Home (dashboard) · Rutinas · Body · Settings. *Body* (humanoid + balance + medidas + metas) reemplaza la idea original de "Stats".
- **Sin FAB central.** Iniciar entreno se hace desde el card "Sesión de hoy" del Home. Si hay sesión activa, la tab bar muta a su **estado "workout activo"**: crece hacia arriba, aparece una *strip* con dot lima pulsante + timer en vivo + ejercicio actual; tap en la strip expande la sheet de logging sets (`workout.html`).
- **Tab activo = píldora expandida** (`flex-grow: 2`) con bg lima y label visible; el resto muestran sólo icono. Patrón de "navigation rail" iOS/Material 3.
- **Top bar**: wordmark `RAWSETS.` (peso 900 + punto lima) a la izquierda · icono contextual a la derecha (settings / edit / streak según pantalla).

### Principios de diseño
- **Tema oscuro Fase 1** (decisión revisada 2026-05-26 tras pivot de marca a lima sobre dark). Tokens semánticos (`bg-dark`, `bg-card`, `text`, `text-mute`, `lime`, `rose`) preparados; tema claro queda como opción de Fase 2 si surge la necesidad.
- **Restraint cromático**: el lima es puntual — hero numbers, FAB/CTA primario, indicador activo, dot live. El resto en neutros (text/text-mute/text-dim). Rose sólo para alertas (punto débil, low balance).
- **Un número hero por pantalla**, gigante (76px+, Inter 900, `tabular-nums`, `letter-spacing -0.04em`). El tamaño contrastado es lo que da impacto.
- **Tipografía**: Inter en todas las pantallas (`font-variant-numeric: tabular-nums` para números técnicos). JetBrains Mono descartado para UI; Zen Dots reservado al wordmark del logo.
- **Densidad alta en sesión activa** (lo más usado). Optimizar tap targets y latencia percibida (optimistic updates).
- **Microinteracciones** como ciudadanos de primera: `scale(0.97)` en `:active`, transiciones spring (`cubic-bezier(0.34, 1.4, 0.64, 1)`), morph del strip a sheet en el workout activo.
- **Sin onboarding largo**: estado vacío con CTA "Crear primera rutina".
- **Teclado numérico custom** para registro de sets (más rápido que el del SO).
- **Solo español Fase 1**.

### Pantallas decididas
- **Home (dashboard balance muscular)** — `DOCS/mockups/home-radar.html`. Hero = radar hexagonal de balance muscular.
- **Active workout (logging sets)** — `DOCS/mockups/workout.html`. Sheet que expande desde la strip de "workout activo" de la tab bar. Lista vertical de tarjetas expandibles + tabla de sets + rest timer inline.
- **Body (balance + medidas + metas)** — `DOCS/mockups/body.html`. Reemplaza la idea original de "Stats". Tab principal. Hero = humanoid SVG vía `react-native-body-highlighter` con grupos coloreados por balance. Toggle Frente/Espalda, banner de punto débil, grid de medidas, lista de los 11 grupos con scores, card de meta activa.

- **Routines** — `DOCS/mockups/routines.html`. Hero = calendario mensual. Celdas con dot color + letra por tipo de rutina (T/E/P). Días futuros sin asignar = dashed (señal "falta planificar"). Tap día dashed → bottom sheet de asignación. Botón "repetir semana" por fila. Debajo: lista de rutinas guardadas + CTA crear nueva.

### Pantallas pendientes de wireframe
- Rutinas (lista, crear, editar).
- Sesión activa (la pantalla crítica de uso real).
- Stats / Historial.
- Settings.
- Catálogo de ejercicios (vista propia o sub-vista dentro de Rutinas — a decidir).

## 9.5 Estrategia Plan B (PWA-ready)

- **Por qué**: optimizar coste (no pagar Apple Developer hasta tener tracción) sin perder audiencia iOS.
- **Disciplina técnica Fase 1**:
  - Cada dependencia que se añade debe verificarse compatible con web. Si no lo es, envolverla en checks `Platform.OS !== 'web'` o buscar alternativa.
  - Las pantallas son **una sola** que se adapta al contenedor (responsive). No bifurcar UI web/móvil.
  - APIs solo-nativo (haptics, cámara, sensores) se aíslan detrás de wrappers con fallback web (no-op si no aplica).
  - Probar regularmente que `npx expo start --web` funciona y la app es navegable.
- **Persistencia local web**: SQLite WASM (mismo SQL/schema que móvil) vía Drizzle. Persistencia OPFS preferida (requiere COOP/COEP headers en deploy de Fase 2).
- **Coste estimado**: +10-15% de tiempo Fase 1 frente a Plan A (nativo puro). Pagado por: PWA "casi gratis" en Fase 2 + opcionalidad estratégica máxima.

## 10. Decisiones abiertas / pendientes antes de scaffolding

1. **Pantallas restantes**: wireframes de Rutinas, Sesión activa, Stats, Settings.
2. **El "bloque gris" del mockup**: qué va ahí (resumen último entrenamiento, racha, sugerencia de sesión, etc.).
3. **Onboarding / primer arranque**: estado vacío con CTA vs precargar rutinas de ejemplo.
4. **Branding técnico**: bundle id (propuesta: `com.rawsets.app`), nombre del paquete, **logo definitivo** (en exploración activa — dirección futurista display, referencias tipo Anero/Blackbox/Sentex).
5. ~~**Ubicación del repo**~~ → **DECIDIDO**: `/home/javier/Personal/RAWSETS/` (2026-05-22).
6. **CLAUDE.md inicial**: decisiones, comandos, convenciones (a redactar al hacer scaffolding).
7. **Flujo de trabajo**: ¿commits directos a main o branches/PRs incluso siendo solo tú? ¿Conventional commits?
8. **Auth**: Better Auth vs Clerk para Fase 2 (no bloquea Fase 1).
9. **Lista exacta de 40 ejercicios** y su mapeo a los 11 grupos musculares (puede definirse al arrancar Fase 1).

---

## Apéndice — referencias

- **Hevy** — benchmark de registro.
- **Symmetry** ([symmetry.club](https://symmetry.club)) — referencia de ángulo analítico. Stack detectado vía sus ofertas: Flutter móvil, Python + Django/DRF + Postgres + Redis + Celery backend.
- **QweryNotes** (otro proyecto del autor): Next.js + Prisma + pnpm + Turborepo. Confirma fluidez en TS/Postgres/monorepos.
