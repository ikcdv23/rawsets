---
name: workflow
description: Reglas de colaboración entre Javier y Claude en RAWSETS. Trabajo asíncrono tipo equipo: cada uno toma tareas, abre PRs, revisa al otro. Solo Javier mergea a `dev`. Usa esta skill como referencia ante cualquier duda sobre flujo (qué rama, qué nombre, qué pongo en la PR, qué reviso, cuándo está done, qué puedo hacer sin pedir permiso). Si una situación no encaja con lo descrito aquí, paro y consulto antes de actuar.
---

# /workflow — Flujo de trabajo del equipo

## Modo de trabajo

Asíncrono por defecto. NO somos pair-programming permanente. Cada cual toma tareas, las lleva sola, abre PR, revisa las del otro.

El pair programming sigue siendo válido **puntualmente**, pero es la excepción no la regla. Cuando aparezca una decisión arquitectónica nueva (no cubierta por ADRs), volvemos a modo conjunto solo para esa decisión.

## Backlog

Por definir. Cuando Javier decida la herramienta (GitHub Issues, Lumma, Linear, etc.), se anota en `CLAUDE.md` y esta skill se actualiza con la referencia. Mientras tanto, las tareas se pactan en conversación.

El **contrato de una tarea** (independiente de la herramienta) tiene:
- Título corto y específico.
- Estado: `backlog` → `in progress` → `in review` → `done`.
- Criterios de aceptación claros antes de empezar.
- Número (`NNN`) único para referenciar en ramas y PRs.

Una tarea solo pasa a `in progress` cuando **alguien la toma explícitamente**. No se trabaja en tareas sin asignar.

## Ramas

### Naming

| Quién | Patrón |
|---|---|
| Javier | `feature/NNN-descripcion-corta` · `fix/NNN-descripcion-corta` |
| Claude | `cld_feature/NNN-descripcion-corta` · `cld_fix/NNN-descripcion-corta` |
| Experimentales (raras) | `spike/algo` o `wip/algo` — escape hatch, sin patrón estricto |

- `NNN` = número de la tarea.
- Descripción en kebab-case.

### Flujo

```
main  ←──merge en release──  dev  ←──PR──  feature/NNN-...  (o cld_feature/NNN-...)
                                ↑                ↑
                          sale de dev      sale de dev
```

- Las ramas de trabajo **salen de `dev`** y **vuelven a `dev`** vía PR.
- `dev` se mergea a `main` cuando hay un release listo. **Esto lo decide y ejecuta Javier**.
- Yo nunca hago merge a `main` ni a `dev`.

## Autoridad

| Acción | Javier | Claude |
|---|---|---|
| Crear ramas `feature/*` y `fix/*` propias | ✅ | ✅ (con prefijo `cld_`) |
| Abrir PRs | ✅ | ✅ |
| Revisar y comentar PRs ajenas | ✅ | ✅ |
| Aprobar PRs ajenas | ✅ | ✅ (con observaciones) |
| **Mergear a `dev`** | ✅ | ❌ |
| **Mergear a `main`** | ✅ | ❌ |
| **Force-push a `dev` o `main`** | ✅ (con cuidado) | ❌ |

Si Claude detecta una operación que solo puede hacer Javier (merge a `dev`, mergear su propia PR, etc.), **para y pide aprobación explícita** antes de cualquier intento.

### Cuenta GitHub

Operaciones GitHub (`gh`, `git push`, `git pull`) siempre con cuenta **`ikcdv23`**. Antes de la primera operación remota de cada sesión, verificar con `gh auth status`. Ver [[feedback-github-account-isolation]] en memoria.

## Autonomía de Claude (alta)

Una vez una tarea está asignada a Claude (o tomada explícitamente del backlog), Claude PUEDE hacer sin pedir permiso:

- Crear la rama (`cld_feature/NNN-...` o `cld_fix/NNN-...`) desde `dev` actualizado.
- Escribir código siguiendo la arquitectura cerrada en [DOCS/adr/](../../../DOCS/adr/).
- Instalar dependencias necesarias para la tarea (`pnpm add`, `pnpm add -D`).
- Correr migraciones locales (`pnpm prisma migrate dev` o equivalente Drizzle).
- Correr el dev server, ejecutar tests, lint, typecheck.
- Hacer commits intermedios en su rama.
- Abrir la PR contra `dev` cuando termine.

Claude PARA Y ESCALA cuando:

- Cambia el alcance de la tarea respecto al criterio inicial.
- Aparece una decisión arquitectónica **no cubierta** por ADRs (es momento de `/adr`).
- Detecta que la tarea está acoplada a otra que también está en curso (riesgo de conflicto).
- Una dependencia que va a instalar tiene impacto sistémico (cambia toolchain, build, plataforma soportada, licencia restrictiva).

## Apertura de PR

Antes de abrir, **Claude verifica por defecto** (no es regla dura pero es práctica):

- `pnpm typecheck` pasa.
- `pnpm lint` pasa.

Si por algún motivo no se pasan, lo declara explícitamente en el cuerpo de la PR.

### Título

Formato **Conventional Commits**:

```
tipo(scope): descripción corta
```

Ejemplos:
- `feat(workouts): logSet use case + adapter SQLite`
- `fix(routines): corregir ordering al añadir ejercicio`
- `refactor(balance): extraer computeBalance a packages/domain`
- `docs(adr): ADR-0002 sobre estrategia de sync`

Tipos válidos: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `style`.

### Cuerpo (template obligatorio)

```markdown
## Resumen
Una o dos frases explicando qué hace esta PR y por qué.

## Cambios
- Bullet 1: qué archivo/módulo y qué cambia.
- Bullet 2: ...

## ADR aplica
- [ADR-NNNN](../DOCS/adr/NNNN-...) — si la PR implementa o respeta una decisión.
- Si introduce decisión nueva no cubierta: indicar que hay ADR pendiente.

## Cómo probar
1. Paso 1 (`pnpm ...`).
2. Paso 2 (interacción en la app).
3. Resultado esperado.

## Autor
Abierta por: Claude  (o "Javier" si es PR suya)
```

### Diferenciación de PRs de Claude

Cuatro capas de señal para que se reconozcan al instante:

1. **Rama** con prefijo `cld_`.
2. **Trailer** `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>` en cada commit.
3. **Label** `claude` aplicada a la PR al abrirla (`gh pr edit <num> --add-label claude`).
4. **Sección "Autor: Claude"** en el cuerpo de la PR.

## Revisión de PRs (ambos lados)

Tanto Javier reviewa las PRs de Claude como Claude reviewa las de Javier. La review busca:

- **Adherencia a la arquitectura** cerrada en [ADRs](../../../DOCS/adr/). Que respete capas (no lógica de dominio en UI, no Drizzle en use cases), patrones (branded types, Result, ports/adapters) y reglas (Service no llama Service de otra feature, etc.).
- **Smells y simplicidad**: acoplamiento innecesario, duplicación, anidación excesiva, nombres poco descriptivos, abstracciones prematuras.
- **UX percibida cuando aplica** (la PR toca UI): estados vacío / error / loading / éxito; fluidez; micro-interacciones; comportamiento offline. Ver [[feedback-rawsets-ux-bar]].

La **correctitud funcional** (¿hace lo que dice?) se asume verificada por los criterios de aceptación de la tarea y los tests/golden-path en la DoD. La review no es para repetir esa verificación.

### Etiquetas de comentarios sugeridas

Convención simple para que el feedback sea claro:

- `nit:` — sugerencia menor, opcional. No bloquea.
- `pregunta:` — quiero entender, no es objeción.
- `cambia:` — debe cambiarse antes de mergear.
- `idea:` — ampliación futura, no para esta PR.

## Definition of Done

Una tarea pasa a `done` cuando se cumplen los tres:

1. **Tests pasan en local** — los que la tarea exigía (mínimo: tests de cualquier función nueva en `domain/`).
2. **Golden path probado en la app real** — el flujo completo del usuario funciona end-to-end. Tipos verdes no significa que se sienta bien.
3. **Sin TODOs sueltos ni warnings nuevos** — no quedan `// TODO`, `console.warn`, ni `any` introducidos sin justificación explícita. Si hay deuda consciente, se anota como Issue separada antes de cerrar.

El **merge a `dev`** es el acto de cierre que ejecuta Javier cuando los tres se cumplen y la PR está aprobada.

## Dailys

Sincrónicas, solo cuando Javier las dispara. Sin cadencia fija.

Cuando Javier diga "daily" (o equivalente), Claude responde con:

- **Qué hice desde la última daily**: commits, PRs abiertas, PRs mergeadas.
- **Bloqueos detectados**: lo que necesita decisión / aprobación.
- **Próximo paso propuesto**: qué tarea sugiero coger ahora.

Javier responde con lo suyo (qué hizo, qué bloquea) y cualquier reasignación.

## Conflictos y casos no previstos

Si Claude se encuentra una situación que esta skill no cubre, **para y consulta**. La regla por defecto es **conservadora**: ante la duda, no actúa.

Ejemplos de "duda razonable":
- Una dependencia nueva tiene licencia rara.
- Un cambio toca config de toolchain compartida.
- Hay merge conflicts con la rama de Javier en curso.
- Aparece deuda en código fuera del scope de la tarea.

## Wishlist (no implementado todavía)

- **OpenClaw + WhatsApp**: que Claude pueda enviar y recibir mensajes como un miembro humano del equipo. Por explorar.
- **CI**: GitHub Actions corriendo typecheck/lint/tests en cada PR. Por montar cuando haya tests reales.
- **Templates en GitHub**: `.github/pull_request_template.md` con el cuerpo de arriba para que se autocomplete al abrir PR.

## Memorias relacionadas

- [[feedback-github-account-isolation]] — cuenta `ikcdv23` siempre.
- [[feedback-rawsets-anti-cognitive-offloading]] — no premasticar pensamiento.
- [[feedback-rawsets-communication-style]] — estilo breve, sin jerga.
- [[feedback-rawsets-ux-bar]] — listón de UX en reviews.
- [[feedback-rawsets-teaching-mode]] — explicar patrones y smells.
