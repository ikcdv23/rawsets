# Modelo de datos — RAWSETS Fase 1

Mapa de las 8 tablas que viven en SQLite local. Resumen de columnas, FKs e invariantes. **No es la fuente del "por qué"** — para razonamiento, cada tabla enlaza a su ADR.

> Cuando schema y este doc discrepen, ganan los schemas Drizzle (`apps/mobile/src/features/<slice>/adapters/schema.ts`). Este doc es un mapa cómodo, no la verdad.

## Convenciones

- **PK**: siempre `text('id').primaryKey()`, UUID v7 generado en cliente. Excepción: `user_profile.id` constante `'me'`.
- **Timestamps**: `integer('xxx', { mode: 'timestamp_ms' })` — epoch ms. Sin TZ persistida en Fase 1.
- **Booleans**: `integer('xxx', { mode: 'boolean' })`.
- **Decimales**: `real()` (kg, RPE, weights del radar).
- **Enums**: `text(..., { enum: VALUES_AS_CONST }).$type<Type>()` con la constante exportada desde `domain/`.
- **FK actions**:
  - `cascade` → borrar padre borra hijo (eventos del workout).
  - `restrict` → no permite borrar padre con hijos vivos (referencias a catálogo).
  - `set null` → suaviza el corte (plan vs ejecución).

## Diagrama de dependencias

```
user_profile (singleton 'me')        ← sin FKs entrantes; los joins futuros usan id='me'

exercises ──┬─→ exercise_muscle_groups (M:N hacia músculos)
            ├─→ routine_exercises  (M:N hacia routines)
            └─→ sets               (FK restrict)

routines ──┬─→ routine_exercises   (cascade)
           ├─→ scheduled_sessions  (set null)
           └─→ workouts            (set null)

workouts ──→ sets                   (cascade)
```

---

## `user_profile` — ADR-0005

Singleton: una sola fila con `id = 'me'`. Garantía vía caso de uso al insertar (Drizzle no fuerza CHECK declarativo).

| Columna       | Tipo                   | Null | Default   | Notas                                          |
| ------------- | ---------------------- | ---- | --------- | ---------------------------------------------- |
| `id`          | text                   | no   | —         | PK, constante `'me'`                           |
| `displayName` | text                   | sí   | —         | Iniciales del avatar; si null muestra `?`      |
| `goal`        | text (enum `Goal`)     | no   | `general` | mass · strength · loss · maintenance · general |
| `unit`        | text (enum `Unit`)     | no   | `kg`      | kg · lb (solo display; dominio siempre kg)     |
| `bodyWeight`  | real                   | sí   | —         | kg. Bloquea volumen real de body-weight        |
| `birthDate`   | integer (timestamp_ms) | sí   | —         | onboarding ligero                              |
| `sex`         | text (enum `Sex`)      | sí   | —         | male · female · other                          |
| `createdAt`   | integer (timestamp_ms) | no   | —         |                                                |

**Enums** (`features/user/domain/user-profile.ts`):
- `GOALS = ['mass','strength','loss','maintenance','general'] as const`
- `UNITS = ['kg','lb'] as const`
- `SEXES = ['male','female','other'] as const`

---

## `exercises` — ADR-0002, ADR-0003

Catálogo mixto: curados (seed) + custom del usuario.

| Columna        | Tipo                  | Null | Default | Notas                                            |
|----------------|-----------------------|------|---------|--------------------------------------------------|
| `id`           | text                  | no   | —       | PK                                               |
| `name`         | text                  | no   | —       |                                                  |
| `equipment`    | text (enum `Equipment`)| no   | —       | barra · mancuerna · peso-corporal · máquina · polea · otro |
| `isBodyweight` | integer (boolean)     | no   | `false` | Activa cálculo `bodyWeight_usuario + set.weight` |
| `isCustom`     | integer (boolean)     | no   | `false` | true = creado por el usuario                     |
| `createdAt`    | integer (timestamp_ms)| no   | —       |                                                  |

**Enum** (`features/exercises/domain/equipment.ts`):
- `EQUIPMENT = ['barra','mancuerna','peso-corporal','maquina','polea','otro'] as const`

> ⚠️ `peso-corporal` (slug) ≠ `isBodyweight` (flag). El slug es categoría de equipamiento. El flag activa la fórmula de volumen. Pueden coexistir (dominadas) o diferir (un ejercicio "polea" no es bodyweight).

---

## `exercise_muscle_groups` — ADR-0002

M:N entre ejercicios y grupos musculares con peso (0..1+).

| Columna       | Tipo                | Null | FK / Constraint                                  |
|---------------|---------------------|------|--------------------------------------------------|
| `exerciseId`  | text                | no   | → `exercises.id` ON DELETE CASCADE               |
| `muscleGroup` | text (enum `MuscleGroup`) | no | 11 grupos planos (ver `domain/muscle-groups.ts`) |
| `weight`      | real                | no   | Contribución 0..1+ (suma libre, ver ADR-0002 §3) |

**PK compuesta**: `(exerciseId, muscleGroup)`.

**Enum** (`features/exercises/domain/muscle-groups.ts` — ya existe):
- 11 valores: pecho, espalda, hombro, biceps, triceps, antebrazo, cuadriceps, isquios, gluteo, pantorrilla, core.

---

## `routines` — ADR-0004

Una sesión nombrada, no un programa multi-día.

| Columna     | Tipo                  | Null | Notas                |
|-------------|-----------------------|------|----------------------|
| `id`        | text                  | no   | PK                   |
| `name`      | text                  | no   | "Tirón A", "Push B"… |
| `createdAt` | integer (timestamp_ms)| no   |                      |

---

## `routine_exercises` — ADR-0004

Composición de una rutina: lista ordenada de ejercicios con targets.

| Columna         | Tipo    | Null | FK / Constraint                              |
|-----------------|---------|------|----------------------------------------------|
| `routineId`     | text    | no   | → `routines.id` ON DELETE CASCADE            |
| `exerciseId`    | text    | no   | → `exercises.id` ON DELETE RESTRICT          |
| `position`      | integer | no   | Orden dentro de la rutina (1, 2, 3…)         |
| `targetSets`    | integer | no   | Nº series planificadas                       |
| `targetRepsMin` | integer | no   | Rango min reps (`>= 1`)                      |
| `targetRepsMax` | integer | no   | Rango max reps (`>= targetRepsMin`)          |
| `targetWeight`  | real    | sí   | Peso objetivo opcional (kg). null = libre    |
| `notes`         | text    | sí   |                                              |

**PK compuesta**: `(routineId, exerciseId)`.

> Si `targetRepsMin == targetRepsMax` la UI muestra "5 reps". Si difieren, "8–12 reps".

---

## `scheduled_sessions` — ADR-0004

Calendario: qué se planificó cada día. Máximo 1 fila por fecha en Fase 1.

| Columna     | Tipo                  | Null | FK / Constraint                              |
|-------------|-----------------------|------|----------------------------------------------|
| `id`        | text                  | no   | PK                                           |
| `date`      | integer (timestamp_ms)| no   | **UNIQUE** — invariante 1 sesión/día         |
| `routineId` | text                  | sí   | → `routines.id` ON DELETE SET NULL. null = descanso planificado |
| `createdAt` | integer (timestamp_ms)| no   |                                              |

> Ausencia de fila = día neutral (no cuenta a favor ni en contra de la racha). Ver tabla de estados en ADR-0006 §4.

---

## `workouts` — ADR-0003

Sesión que ocurrió en el tiempo. `routineId` nullable = entreno libre.

| Columna      | Tipo                  | Null | FK / Constraint                              |
|--------------|-----------------------|------|----------------------------------------------|
| `id`         | text                  | no   | PK                                           |
| `routineId`  | text                  | sí   | → `routines.id` ON DELETE SET NULL           |
| `startedAt`  | integer (timestamp_ms)| no   |                                              |
| `finishedAt` | integer (timestamp_ms)| sí   | null = en progreso o abandonado              |
| `notes`      | text                  | sí   |                                              |

**Invariantes (caso de uso, no schema):**
- Si `finishedAt != null` → `finishedAt >= startedAt`.

---

## `sets` — ADR-0003

Log inmutable de series **realmente ejecutadas**. No hay flag `completed`: si existe la fila, ocurrió.

| Columna       | Tipo    | Null | FK / Constraint                              |
|---------------|---------|------|----------------------------------------------|
| `id`          | text    | no   | PK                                           |
| `workoutId`   | text    | no   | → `workouts.id` ON DELETE CASCADE            |
| `exerciseId`  | text    | no   | → `exercises.id` ON DELETE RESTRICT          |
| `setNumber`   | integer | no   | N-ésimo set de ese ejercicio en ese workout (`>= 1`) |
| `weight`      | real    | no   | kg (`>= 0`). 0 vale para bodyweight puro     |
| `reps`        | integer | no   | `>= 1` (0 reps = no se persiste)             |
| `rpe`         | real    | sí   | 0..10 si está definido                       |
| `restSeconds` | integer | sí   | Descanso tras este set                       |

**Invariantes (caso de uso, no schema):**
- `reps >= 1`, `weight >= 0`, `rpe ∈ [0,10]` si presente.
- `setNumber` arranca en 1, contador relativo a `(workoutId, exerciseId)`.

---

## Conceptos derivados (sin tabla)

Calculados al vuelo, no persistidos. Ver ADR-0006.

- **PRs por ejercicio**: `computePRs(exerciseId, sets) → { byRepCount, bestE1RM }` en `features/workouts/domain/prs.ts`.
- **Racha**: `currentStreak(days)` y `bestStreak(days)` en `features/scheduling/domain/streak.ts`. Combina `scheduled_sessions` + `workouts` por fecha → `DayState ∈ {✅, ❌, ◯}`.

## Constantes de dominio (no en DB)

- **`MUSCLE_TARGETS`** (`features/exercises/domain/muscle-targets.ts`): objetivos de volumen por grupo y 14 días. Global en Fase 1, personalizable en Fase 2 (ADR-0002 §4).
