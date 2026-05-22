# CLAUDE.md

> Contexto para Claude Code en este repo. Se actualiza al cerrar decisiones nuevas.

## Qué es esto

RAWSET — app móvil para registrar entrenamientos de gimnasio con énfasis en análisis de balance muscular. Proyecto personal de aprendizaje end-to-end (móvil + backend + DevOps + ML).

**Estado actual**: pre-scaffolding. Existen únicamente la ficha técnica de discovery y este CLAUDE.md. Aún no hay código.

## Fuente de verdad para decisiones

Toda decisión de stack, alcance, roadmap, branding y UX vive en [DOCS/ficha-tecnica.md](DOCS/ficha-tecnica.md). Es un documento vivo. Antes de proponer cambios estructurales, leer esa ficha primero y respetar lo decidido salvo que haya razones nuevas para cuestionar.

## Convenciones clave

- **Lenguaje**: TypeScript strict en todo. Sin `any` salvo casos justificados.
- **Estilo**: la app es **PWA-ready desde día 1** (Plan B). Toda dependencia nueva debe verificarse compatible con web (`react-native-web`). APIs solo-nativo van aisladas detrás de wrappers con fallback web.
- **Paleta y design tokens**: definidos en la ficha técnica (sección 2). Usar tokens semánticos (`primary`, `accent`, `destructive`, `surface`, `foreground`), nunca colores literales en componentes.
- **Grupos musculares**: 12 finos en storage, 6 agrupados en UI por defecto. Listado en la ficha técnica (sección 6).
- **Unidades**: kg por defecto, lb opcional vía settings. La lógica trabaja siempre en kg internamente.

## Estructura prevista

```
rawset/
├── apps/mobile/        # Expo (iOS, Android, Web) — Fase 1
├── apps/api/           # Hono backend — Fase 2
├── packages/domain/    # Tipos + lógica pura compartida
├── packages/db/        # Schema Drizzle compartido — Fase 2
└── DOCS/
```

Monorepo plano con **pnpm workspaces**, sin Turborepo en Fase 1.

## Cosas a NO hacer

- No añadir Turborepo, Nx ni similares hasta que la cache aporte valor real (>=2 apps con CI lenta).
- No bifurcar UI web vs móvil — pantallas únicas responsivas.
- No usar `bg-white`, `#FFFFFF` o cualquier color literal en componentes — siempre tokens semánticos.
- No meter modo oscuro activo en Fase 1 (tokens preparados, paleta a definir en Fase 2).
- No clonar Hevy feature-by-feature. El diferenciador es el análisis de balance, todo lo demás es mínimo.
- No introducir Prisma — el ORM es Drizzle por compatibilidad con expo-sqlite y sqlite-wasm.

## Comandos

*(Pendientes — se documentarán al hacer scaffolding del monorepo)*

## Referencias rápidas

- Benchmark de registro: **Hevy**.
- Inspiración analítica: **Symmetry** (symmetry.club).
- Referencia visual: **Arounda — Supporty**.
