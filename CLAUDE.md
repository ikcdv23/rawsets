# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Contexto para Claude Code en este repo. Se actualiza al cerrar decisiones nuevas.

## Qué es esto

RAWSETS — app móvil para registrar entrenamientos de gimnasio con énfasis en análisis de balance muscular. Proyecto personal de aprendizaje end-to-end (móvil + backend + DevOps + ML).

**Estado actual**: scaffolding de Fase 1 en curso. Monorepo + [apps/mobile](apps/mobile/) en Expo SDK 56 con NativeWind y expo-router. Hitos cerrados hasta F1.6 (route group `(workspace)` con tabs `home`, `routines`, `stats`, `settings`). Aún sin lógica de dominio, sin DB, sin `packages/*`.

## Fuente de verdad para decisiones

Toda decisión de stack, alcance, roadmap, branding y UX vive en [DOCS/ficha-tecnica.md](DOCS/ficha-tecnica.md). Es un documento vivo. Antes de proponer cambios estructurales, leer esa ficha primero y respetar lo decidido salvo que haya razones nuevas para cuestionar.

Las decisiones arquitectónicas derivadas se documentan como ADRs en [DOCS/adr/](DOCS/adr/). Empezar por [ADR-0001](DOCS/adr/0001-arquitectura.md) (Hexagonal + DDD táctico + Vertical Slicing).

## Cómo colaborar con Javier

Reglas de fondo. Aplican a cualquier interacción con Javier en este repo, no solo a tareas concretas.

- **Modo enseñanza activa**: antes de implementar algo no trivial, decir qué patrón aplico y por qué. Cuando aparezca un smell (acoplamiento, lógica de dominio en UI, `any` escondidos, prop drilling, side-effects sueltos), señalarlo con su nombre aunque "funcione". Nombrar el principio detrás (SOLID, separation of concerns, dependency inversion, etc.) cuando aporte sin saturar.
- **Estilo de comunicación**: frases cortas, una idea por frase, sin jerga innecesaria. Si una palabra técnica aporta, glosarla al vuelo en lenguaje cotidiano. Comparaciones antes que definiciones abstractas. Usar listas y tablas cuando se enumeran cosas.
- **No premasticar el pensamiento**: cuando Javier pueda razonar algo por sí mismo, devolverle la pregunta antes de soltar veredicto ("¿qué te dice tu intuición?"). En decisiones, exponer alternativas con trade-offs reales y dejarle elegir; no decidir por él en silencio. Exigir sí/no explícito antes de cerrar decisiones (lección del ADR prematuro del 2026-05-25).
- **UX como first-class**: estados vacío/error/loading son ciudadanos de primera, no "polish final". Considerar fluidez percibida, optimistic updates, comportamiento offline (gimnasios = red mala) en el diseño de cada feature, no después.
- **Cuenta GitHub**: siempre `ikcdv23` (cuenta personal de Javier). Nunca cruzar con `javieralc-kuik` (cuenta de empresa). Verificar con `gh auth status` antes de la primera operación remota de cada sesión. Si hace falta cambiar, usar exactamente `gh auth switch`.
- **Flujo de trabajo**: ver [skill `/workflow`](.claude/skills/workflow/SKILL.md) para naming de ramas, criterios de PR, review y DoD. Resumen: yo abro PRs desde `cld_feature/NNN-...` o `cld_fix/NNN-...`. Javier mergea a `dev`, yo nunca.

## Convenciones clave

- **Lenguaje**: TypeScript strict en todo. Sin `any` salvo casos justificados. `tsconfig.base.json` añade `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`.
- **Lint/format**: **Biome** (no ESLint, no Prettier). Single quotes, semicolons, trailingCommas: all, lineWidth 100. Reglas custom: `useImportType` error, `noNonNullAssertion` y `noExplicitAny` warn.
- **Estilo**: la app es **PWA-ready desde día 1** (Plan B). Toda dependencia nueva debe verificarse compatible con web (`react-native-web`). APIs solo-nativo van aisladas detrás de wrappers con fallback web.
- **Paleta y design tokens**: definidos en la ficha técnica (sección 2). Vivos como CSS vars en [apps/mobile/src/global.css](apps/mobile/src/global.css) y mapeados a clases Tailwind en [apps/mobile/tailwind.config.js](apps/mobile/tailwind.config.js). Usar tokens semánticos (`primary`, `accent`, `destructive`, `surface`, `foreground`), nunca colores literales en componentes.
- **Path alias**: `@/*` → `apps/mobile/src/*` (definido en [apps/mobile/tsconfig.json](apps/mobile/tsconfig.json)). Usar `@/components/...`, `@/global.css`, etc.
- **Componentes UI**: por defecto viven en `features/<x>/ui/components/`. Solo suben a `apps/mobile/src/components/` cuando se usan en 2+ features o son chrome global (tab bar, header, design system primitives). Default a feature, no al "shared graveyard".
- **Grupos musculares**: 11 grupos planos en Fase 1 (pecho, espalda, hombro, biceps, triceps, antebrazo, cuadriceps, isquios, gluteo, pantorrilla, core). Granularidad fina (separar hombro anterior/medio/posterior, espalda en lats/lumbar, etc.) aplazada a Fase 2 con ADR cuando el uso real lo justifique. Ver [DOCS/ficha-tecnica.md](DOCS/ficha-tecnica.md) sección 6.
- **Unidades**: kg por defecto, lb opcional vía settings. La lógica trabaja siempre en kg internamente.

## Arquitectura del scaffold actual

- **Monorepo plano con pnpm workspaces** (`apps/*` + `packages/*`), Node ≥22, pnpm ≥10. Sin Turborepo en Fase 1.
- **[apps/mobile](apps/mobile/)** — Expo SDK 56 + RN 0.85 + React 19.2 + react-native-web 0.21. Entry point es `expo-router/entry` (file-based routing).
  - Routing: [src/app/index.tsx](apps/mobile/src/app/index.tsx) redirige a `/home`. El layout real de tabs vive bajo el route group `(workspace)/_layout.tsx`. Las pantallas raíz a editar están en `src/app/(workspace)/{home,routines,stats,settings}/`.
  - `(workspace)` (paréntesis) es un **route group** de expo-router: agrupa pantallas bajo un layout compartido sin añadir segmento a la URL. La tab bar custom va inyectada vía prop `tabBar` en ese `_layout.tsx` (placeholder actual en [src/components/tab-bar.tsx](apps/mobile/src/components/tab-bar.tsx)).
  - Fuentes (Inter, JetBrains Mono, Zen Dots) se cargan en [src/app/_layout.tsx](apps/mobile/src/app/_layout.tsx) vía `@expo-google-fonts/*` + `useFonts`. Render bloqueado hasta `loaded`.
  - React Compiler está **activado experimentalmente** (`app.json` → `experiments.reactCompiler: true`). Evitar patrones que rompan sus reglas (mutar refs durante render, side-effects en cuerpo de componente).
- **[apps/mobile/metro.config.js](apps/mobile/metro.config.js)** está configurado para monorepo: `watchFolders` apunta a la raíz y `nodeModulesPaths` incluye ambos `node_modules`. Cualquier paquete RN nuevo que Metro no resuelva probablemente necesita un `public-hoist-pattern` en `.npmrc`.
- **packages/** está vacío (solo `.gitkeep`). `packages/domain` (lógica pura compartida) y `packages/db` (schema Drizzle) llegan más adelante.

## Cosas a NO hacer

- No añadir Turborepo, Nx ni similares hasta que la cache aporte valor real (>=2 apps con CI lenta).
- No bifurcar UI web vs móvil — pantallas únicas responsivas.
- No usar `bg-white`, `#FFFFFF` o cualquier color literal en componentes — siempre tokens semánticos.
- No meter modo oscuro activo en Fase 1 (tokens preparados, paleta a definir en Fase 2).
- No clonar Hevy feature-by-feature. El diferenciador es el análisis de balance, todo lo demás es mínimo.
- No introducir Prisma — el ORM es Drizzle por compatibilidad con expo-sqlite y sqlite-wasm.

## Comandos

### Setup
```bash
pnpm install                                       # instalar todo el monorepo
```

### Día a día
```bash
pnpm --filter @rawsets/mobile web                  # dev server (web)
pnpm --filter @rawsets/mobile start                # dev server (universal con QR)
pnpm --filter @rawsets/mobile ios                  # abrir en iOS (Expo Go)
pnpm --filter @rawsets/mobile android              # abrir en Android (Expo Go)
pnpm lint                                          # biome check en todo el repo
pnpm lint:fix                                      # biome check --write
pnpm format                                        # biome format --write
pnpm typecheck                                     # tsc --noEmit en cada workspace que lo tenga
pnpm --filter @rawsets/mobile typecheck            # solo móvil
```

### Workspaces
```bash
pnpm --filter @rawsets/mobile add <paquete>        # instalar en un workspace
pnpm --filter @rawsets/mobile add -D <paquete>     # devDep
pnpm add -w <paquete>                              # instalar en la raíz
pnpm -r --if-present <script>                      # script en todos los workspaces
```

### Troubleshooting
```bash
pnpm --filter @rawsets/mobile web --clear          # limpiar caché de Metro
rm -rf node_modules apps/*/node_modules apps/mobile/.expo && pnpm install   # reinstalación
pnpm store prune                                   # purgar caché global de pnpm
pnpm --filter @rawsets/mobile exec npx expo install --check   # validar deps contra SDK
```

**Si Metro grita `Unable to resolve module <foo>`** y el módulo está en el ecosistema Expo/RN: añadir el patrón a `.npmrc` (`public-hoist-pattern[]=...`) y `pnpm install`. Ver explicación de fondo en sesión de discovery.

## Referencias rápidas

- Benchmark de registro: **Hevy**.
- Inspiración analítica: **Symmetry** (symmetry.club).
- Referencia visual: **Arounda — Supporty**.
