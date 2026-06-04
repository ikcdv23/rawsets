# Architecture Decision Records

Decisiones técnicas importantes de RAWSETS. Cada ADR documenta el contexto, las alternativas y las consecuencias de una decisión en el momento en que se tomó.

**Formato**: MADR-lite. Ver [skill `/adr`](../../.claude/skills/adr/SKILL.md) para el procedimiento.

**Status posibles**:
- `Proposed` — discutido pero aún no aplicado en código.
- `Accepted` — aplicado, vigente.
- `Superseded by ADR-XXXX` — reemplazado por una decisión posterior.
- `Deprecated` — ya no aplica.

**Distinción con [`DOCS/ficha-tecnica.md`](../ficha-tecnica.md)**: la ficha técnica es la **fuente de verdad** del stack, branding y roadmap (decisiones grandes ya cerradas). Los ADRs documentan decisiones **derivadas** que aparecen durante la construcción.

## Índice

- [0001 — Arquitectura: Hexagonal + DDD táctico + Vertical Slicing](0001-arquitectura.md) — Accepted · 2026-05-25
- [0002 — Modelo de Exercise y cálculo del balance muscular](0002-modelo-exercise-y-balance-muscular.md) — Accepted · 2026-05-28
- [0003 — Modelo de Set y Workout](0003-modelo-set-y-workout.md) — Accepted · 2026-05-28
- [0004 — Modelo de Routine y programación por calendario](0004-modelo-routine-y-calendario.md) — Accepted · 2026-05-28
- [0005 — Modelo de UserProfile](0005-modelo-user-profile.md) — Accepted · 2026-05-28
- [0006 — Modelo de PR y Streak (derivados)](0006-modelo-pr-y-streak.md) — Accepted · 2026-05-28
- [0007 — Auth: Supabase + Google OAuth](0007-auth-supabase-google.md) — Accepted · 2026-05-28
- [0008 — Inicialización de DB con SQLiteProvider (async-safe en web)](0008-db-init-sqlite-provider.md) — Accepted · 2026-05-29
