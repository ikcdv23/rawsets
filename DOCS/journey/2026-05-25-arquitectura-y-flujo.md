# 2026-05-25 — Arquitectura y flujo de trabajo

> Sesión larga (≈3 días según Javier) dedicada a definir la arquitectura del proyecto y el flujo de colaboración entre Javier y Claude. Es la primera sesión que produce decisiones de fondo en RAWSETS.

## Punto de partida

- Scaffolding F1.6 cerrado: route group `(workspace)`, NativeWind, expo-router.
- [Ficha técnica](../ficha-tecnica.md) completa pero sin decisiones arquitectónicas derivadas.
- Sin convenciones de colaboración formalizadas.
- `/adr` aún no usada (acabábamos de definir la skill antes de empezar).

## Lo que se cerró

### Arquitectura — [ADR-0001](../adr/0001-arquitectura.md)

**Hexagonal + DDD táctico + Vertical Slicing**.

- Dominio puro al centro (Entity, Value Object, funciones puras).
- Use Cases finos que orquestan.
- Ports (interfaces) describen "qué necesita la feature del exterior".
- Adapters implementan los Ports (SQLite móvil, sqlite-wasm web, in-memory para tests).
- Organización por feature (`features/workouts/`, no por tipo de archivo).

Sub-decisiones cerradas, todas con sí/no explícito de Javier:

| | Decisión |
|---|---|
| Modelado | Tipos planos + funciones puras (no clases). Clases solo para errores tipados. |
| Errores | `Result<Ok, Err>` en toda frontera fallable. `throw` solo para fallos genuinamente inesperados de infra. |
| Reads/writes | Simétrico — todo pasa por Use Case. |
| Dominio compartido | `packages/domain/` reservado para lo que comparta backend Fase 2. |
| DTOs | Sin DTOs en Fase 1 (no hay frontera externa todavía). |
| DI | Manual vía funciones fábrica. |

### Skills creadas

| Skill | Archivo | Función |
|---|---|---|
| `/adr` | [.claude/skills/adr/SKILL.md](../../.claude/skills/adr/SKILL.md) | Documentar decisiones arquitectónicas vía diálogo |
| `/workflow` | [.claude/skills/workflow/SKILL.md](../../.claude/skills/workflow/SKILL.md) | Reglas de colaboración: ramas, PRs, review, DoD, autonomía |

### Memorias guardadas

En `~/.claude/projects/-home-javier-Personal-RAWSETS/memory/`:

- `user-javier-learning-goal.md` — RAWSETS es vehículo de aprendizaje + UX-first.
- `user-javier-cognitive-health.md` — salud cognitiva, anti-brainrot, no delegar pensamiento a IA.
- `feedback-rawsets-teaching-mode.md` — modo enseñanza activa.
- `feedback-rawsets-anti-cognitive-offloading.md` — no premasticar pensamiento.
- `feedback-rawsets-communication-style.md` — estilo breve, sin jerga.
- `feedback-rawsets-ux-bar.md` — UX first-class.
- `feedback-rawsets-bottom-nav.md` — dock cóncavo + FAB central.
- `feedback-rawsets-brand-discipline.md` — primary violeta, lime decorativo, wordmark con énfasis tipográfico.
- `feedback-github-account-isolation.md` — siempre `ikcdv23`, nunca `javieralc-kuik`.
- `project-rawsets-tab-bar-pending.md` — tab bar es siguiente pieza de UI.

### CLAUDE.md actualizado

Sección **"Cómo colaborar con Javier"** añadida, traduciendo las memorias compartibles (estilo, modo enseñanza, anti-cognitive-offloading, UX, GitHub account, workflow). El objetivo: que esto viaje con el repo y Claude en otros ordenadores las lea automáticamente, sin depender de la memoria local de cada máquina.

### `.gitignore` ajustado

De `.claude/` (todo ignorado) a solo `.claude/settings.local.json` y caches. Las skills y `settings.json` ahora se trackean.

## Momentos pedagógicos clave

### a. Hexagonal vs el patrón de Lumma

Comparamos arquitectura con su proyecto anterior (Lumma — Action/Service/Repository). Javier capturó un error mío: yo describí Lumma "de oídas", asumiendo que mezclaba reglas y orquestación como descuido. Me obligó a ir a leerlo de verdad. Lo leí y corregí: en Lumma la mezcla es **decisión consciente y documentada** ("empezar simple, evolucionar cuando duela"), no descuido. Lección: no opinar sobre código que no he leído.

### b. Tipos planos vs clases

Javier preguntó si las entidades serían clases. Empecé argumentando con "los datos cruzan fronteras de serialización constantemente". Detectó un smell: "¿HTTP no es solo para web? Estamos haciendo móvil". Tenía razón — sobre-vendí el argumento. Corregí: la serialización ocurre en los bordes (DB siempre, red en Fase 2), no "constantemente". Los otros argumentos (React funcional, `this`, idiomático) seguían en pie.

### c. La confusión persistente con Port

Tres rondas necesarias para que quedara claro que **Port no es un paso en el flujo de runtime, es un tipo en el código**. Javier propuso la analogía que cerró la idea:

> "Adapter es el cocinero que se sabe todas las recetas, y el Use Case es el que dicta de la carta (el Port) lo que quiere y cómo lo quiere."

A partir de ahí, sin fricciones.

### d. ADR prematuro

Escribí ADR-0001 cuando Javier dijo "tenemos que cerrar ya". Lo leí como "aprueba y formaliza". Era "deja de dar vueltas, decide". Él lo paró: "no hemos quedado en consenso claro". Borré el ADR y fuimos punto por punto con sí/no explícito. Lección capturada como `feedback-rawsets-anti-cognitive-offloading`: exigir aprobación explícita antes de cerrar.

### e. Dopamina del esfuerzo

Tras cerrar arquitectura, Javier verbalizó: *"Esto que siento ahora es un chute de dopamina por el avance percibido, entender esta propuesta, pero he tardado casi una hora en entenderlo, es dopamina de buena calidad que no me fríe el cerebro como los shorts."* Compartió su preocupación por el brain rot y por delegar pensamiento a IA. Capturado como `user-javier-cognitive-health` + `feedback-rawsets-anti-cognitive-offloading`.

## Pendiente al cerrar la sesión

- **Commitear** los cambios producidos (no se hizo en la sesión — Javier decide):
  - `M .gitignore`
  - `M CLAUDE.md`
  - `?? .claude/skills/`
  - `?? DOCS/adr/`
  - `?? DOCS/journey/`
  - `?? apps/mobile/.claude/settings.json`
- **Decidir herramienta de backlog** (GitHub Issues vs Lumma vs Linear). Mientras tanto, tareas pactadas en conversación.
- **Próxima pieza de UI**: tab bar — siguiendo `feedback-rawsets-bottom-nav` (dock cóncavo violeta + FAB central). NO es feature en sentido workflow (es chrome global), no tendrá `features/.../` propio.
- **Primera feature real**: probablemente `workouts/` con `logSet` como caso de uso inaugural. Estrenará Hexagonal de verdad.

## Notas para el yo-del-futuro

- Si en 2-3 meses ves muchos Use Cases que son wrappers de 1 línea sobre el repo, reconsiderar la simetría reads/writes. Se aceptó por consistencia pedagógica, no por valor intrínseco.
- Si las entidades terminan siendo bolsas de datos sin verbos y toda la lógica vive en Use Cases, es **anemic domain** — sacar verbos a `domain/`.
- Si detalles de Drizzle aparecen en un Use Case o un componente, es **leaky abstraction** — limpiar inmediatamente.
- Las skills `/adr` y `/workflow` son organismos vivos. Cuando aparezca un caso real que no encaje, **actualizar la skill**, no improvisar.
