---
name: adr
description: Documenta una decisión arquitectónica de RAWSETS como Architecture Decision Record (MADR-lite) en `DOCS/adr/`. Usa esta skill cuando se tome una decisión técnica significativa con más de una alternativa viable — elección de librería, dónde vive un tipo, qué patrón aplicar, cambio de schema, decisión de UX con impacto arquitectónico. NO la uses para correcciones triviales, fixes de bug evidentes o decisiones ya documentadas en `DOCS/ficha-tecnica.md`.
---

# /adr — Architecture Decision Record

## Objetivo

Capturar una decisión técnica significativa con su contexto, alternativas evaluadas y consecuencias. El valor pedagógico está en **el proceso de razonarla con trade-offs**, no en el doc final. La conversación es el aprendizaje; el ADR es el artefacto que queda para el yo-del-futuro.

## Cuándo aplicar

Dispara la skill cuando:
- Hay >1 alternativa viable sobre la mesa (librería, patrón, ubicación de código, estrategia de estado, etc.).
- La decisión tendrá consecuencias que se sentirán a meses vista.
- Es una decisión que en 6 meses se preguntará "¿por qué hice esto así?".

NO la dispares cuando:
- La decisión ya está cerrada en [DOCS/ficha-tecnica.md](DOCS/ficha-tecnica.md) — esa es la fuente de verdad de stack y branding; los ADRs documentan decisiones **derivadas**, no las grandes ya cerradas.
- Es un fix obvio sin alternativas reales.
- Es preferencia de estilo trivial.

## Procedimiento

Hazlo en este orden, no lo saltes:

### 1. Localiza el siguiente número
- Lee `DOCS/adr/` (créalo si no existe). Coge el ADR más alto y suma 1. Numera con 4 dígitos: `0001`, `0002`, ...
- Si el directorio no existe, crea también `DOCS/adr/README.md` (ver plantilla al final).

### 2. Diálogo previo (NO escribas el doc todavía)
Conversa con Javier para clarificar:
- **Contexto**: qué situación obliga a decidir. ¿Qué restricción nueva, qué feature pendiente, qué smell detectado?
- **Decision drivers**: qué factores pesan más en esta decisión (PWA-ready, learning value, UX/fluidez, simplicidad, perf, mantenibilidad…). Listarlos explícitamente.
- **Alternativas viables**: al menos 2, idealmente 3. Si solo se te ocurre una, busca más antes de seguir. Una opción "no hacer nada / status quo" cuenta como alternativa válida.
- **Pros/contras de cada alternativa** evaluadas contra los drivers, no en abstracto.
- **Decisión propuesta** y por qué gana frente a las demás.
- **Consecuencias**: qué se gana (positivas), qué se sacrifica (negativas), qué queda como riesgo o deuda.

Si Javier no tiene clara una parte, no la inventes — pregúntale. Si hay un trade-off importante que él no ha mencionado, ponlo sobre la mesa antes de cerrar.

### 3. Escribe el ADR
Solo cuando el diálogo haya cerrado los puntos anteriores, escribe el archivo en `DOCS/adr/NNNN-slug-kebab.md` usando la plantilla MADR-lite (más abajo).

El `slug` debe ser corto, en kebab-case, descriptivo del *qué* (no del *por qué*). Ej.: `0003-zustand-vs-jotai-estado-cliente.md`, no `0003-decision-de-estado.md`.

### 4. Actualiza el índice
Añade una línea al final de `DOCS/adr/README.md`:
`- [NNNN — Título corto](NNNN-slug.md) — Status · YYYY-MM-DD`

### 5. Confirma con Javier
Resume en 2 líneas qué quedó decidido, dónde vive el ADR, y qué consecuencia concreta tiene en la próxima pieza de código que toquemos. No commitees el archivo — eso lo decide él.

## Plantilla MADR-lite

```markdown
# NNNN — Título descriptivo de la decisión

- **Status**: Proposed | Accepted | Superseded by [ADR-XXXX](XXXX-slug.md) | Deprecated
- **Fecha**: YYYY-MM-DD
- **Deciders**: Javier (+ Claude como sparring si aplica)

## Contexto

Qué situación nos obliga a decidir. Restricciones, fuerzas en juego, qué falla si no decidimos.
(2–6 frases. No más.)

## Decision drivers

- Driver 1 (ej. "PWA-ready: la decisión debe funcionar en `react-native-web`")
- Driver 2 (ej. "Learning value: preferimos la opción que enseñe el patrón canónico, aunque tenga más boilerplate")
- Driver 3 …

## Alternativas consideradas

### A. <Nombre alternativa A>
- **Pros**: …
- **Contras**: …

### B. <Nombre alternativa B>
- **Pros**: …
- **Contras**: …

### C. Status quo / no hacer nada (cuando aplique)
- **Pros**: …
- **Contras**: …

## Decisión

Optamos por **<alternativa elegida>**.

Por qué gana frente a las demás, expresado contra los drivers de arriba.
(2–4 frases.)

## Consecuencias

- **Positivas**: qué desbloquea, qué simplifica.
- **Negativas / aceptadas**: qué sacrificamos conscientemente.
- **Riesgos / a vigilar**: qué podría romper esta decisión en el futuro y obligar a un ADR de supersede.

## Referencias

- Enlaces a docs, posts, issues, o ADRs relacionados (opcional).
```

## Plantilla `DOCS/adr/README.md` (crear si no existe)

```markdown
# Architecture Decision Records

Decisiones técnicas significativas de RAWSETS. Cada ADR documenta el contexto, alternativas y consecuencias de una decisión en el momento en que se tomó.

**Formato**: MADR-lite. Ver [skill `/adr`](../../.claude/skills/adr/SKILL.md) para el procedimiento.

**Status posibles**:
- `Proposed` — discutido pero aún no aplicado en código.
- `Accepted` — aplicado, vigente.
- `Superseded by ADR-XXXX` — reemplazado por una decisión posterior; archivo se mantiene como historia.
- `Deprecated` — ya no aplica, sin reemplazo directo.

**Distinción con [`DOCS/ficha-tecnica.md`](../ficha-tecnica.md)**: la ficha técnica es la **fuente de verdad** del stack, branding y roadmap (decisiones grandes ya cerradas). Los ADRs documentan decisiones **derivadas** que aparecen durante la construcción.

## Índice

<!-- Las nuevas entradas se añaden aquí, una por línea. -->
```

## Notas de uso

- Si en mitad del diálogo Javier cambia de opinión, refleja eso en el ADR — los `Decision drivers` se ajustan, las alternativas se reevalúan, no edites a posteriori sin dejar rastro.
- Si un ADR queda obsoleto por una decisión posterior, NO lo borres: márcalo `Superseded by ADR-XXXX` y deja el archivo. Los ADRs son historia.
- Si una decisión que iba a ser ADR resulta ser ya parte de la ficha técnica, no dupliques — díselo a Javier y referencia la sección de la ficha.
