# RAWSET

> Workout tracker focused on muscle balance analysis. Built with Expo (React Native + Web) and TypeScript.

**Estado**: pre-scaffolding. La ficha técnica con decisiones de discovery está en [`DOCS/ficha-tecnica.md`](DOCS/ficha-tecnica.md).

## Concepto

Una app móvil multiplataforma para registrar entrenamientos de gimnasio que se diferencia del estándar (Hevy, Symmetry) por **análisis de balance muscular** desde el primer día: storage por grupo muscular fino, visualización agrupada y detección de desbalances en tu microciclo.

## Stack en una línea

Expo + React Native + Expo Web · TypeScript · NativeWind · SQLite (expo-sqlite / sqlite-wasm) + Drizzle ORM · pnpm workspaces monorepo.

## Estructura prevista (al hacer scaffolding)

```
rawset/
├── apps/
│   ├── mobile/      # Expo app (iOS, Android, Web)
│   └── api/         # Hono backend (Fase 2)
├── packages/
│   ├── domain/      # Tipos + lógica pura compartida
│   └── db/          # Schema Drizzle compartido (Fase 2)
└── DOCS/
    └── ficha-tecnica.md
```

## Roadmap

- **Fase 1** — MVP móvil local + dashboard de balance muscular. Distribución alpha vía Expo Go.
- **Fase 2** — Backend, auth, sync, rutinas compartidas. Google Play público + PWA iOS.
- **Fase 3** — Microservicio Python para análisis/ML sobre datos acumulados.

Detalle completo en la [ficha técnica](DOCS/ficha-tecnica.md).
