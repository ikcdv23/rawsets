# 0009 — PRs y Badges como subsistema de gamificación

- **Status**: Proposed
- **Fecha**: 2026-06-25
- **Deciders**: Javier + Claude (sparring)

## Contexto

Los logros (badges) necesitan leer datos históricos de entrenamiento para determinar cuándo un usuario cruza un umbral relevante: primer workout completado, levantar 100 kg en press banca, acumular 500 kg de volumen total, mantener una racha de 30 días, etc.

El ADR-0006 (sección 3) definió los PRs como "se computa, no se almacena" — funciones puras sobre `Set`. Esto funciona para consultas ad-hoc, pero no permite:
- Detectar en el momento (por set) cuándo se bate un récord
- Notificar al usuario ("¡Nuevo PR!")
- Evaluar badges en tiempo real
- Responder consultas históricas con eficiencia a medida que crecen los datos

Necesitamos un modelo híbrido que preserve la velocidad de lectura sin perder la capacidad de corrección si los datos fuente cambian.

## Decision drivers

- **D1. Feedback en tiempo real**: el usuario ve el PR y el badge desbloqueado inmediatamente al completar un set, no al cerrar el entrenamiento.
- **D2. Corrección posible**: si se editan o borran workouts históricos, el sistema debe poder recalibrarse sin perder datos manuales.
- **D3. Velocidad de lectura**: las consultas de PRs y badges no deben degradarse con el tiempo.
- **D4. Single source of truth**: `Set` sigue siendo la fuente de verdad. Lo persistido en PRs y badges es un caché derivado, validable contra los sets.
- **D5. Separación de dominios**: PRs y badges cruzan ejercicios, workouts y perfil. Merecen su propio slice, no acoplarse a `user/` ni a `workouts/`.

## Alternativas consideradas

### A. Todo derivado (status quo del ADR-0006)

PRs y badges se calculan cada vez desde `Set` mediante queries agregadas.

- **Pros**: sin datos duplicados, cero sync, siempre fresco.
- **Contras**: las queries empeoran con el tiempo; imposible detectar el *momento exacto* de un PR sin comparar contra el histórico en cada escritura; la evaluación de badges requeriría recorrer todos los sets en cada render o cada set completado.

### B. Todo persistido

Se escribe `personal_records` y `badge_state` al completar cada set, y son la única fuente de verdad para lecturas. Si se modifican datos históricos, el usuario debe borrar y regenerar manualmente.

- **Pros**: lecturas instantáneas, modelo simple.
- **Contras**: si un workout se borra o edita, los PRs y badges quedan inconsistentes sin forma de reparación automática. Riesgo alto de datos corruptos sin que el usuario lo sepa.

### C. Híbrido con flag dirty (elegida)

Se persisten PRs y badges al completar cada set. Cada registro tiene un flag `dirty` (por defecto `false`). Si se modifica un workout histórico, los PRs y badges afectados se marcan `dirty`. Un proceso de recálculo (`recalculatePRs`, `recalculateBadges`) barre los dirty y los re-evalúa desde `Set`.

Además, existe un botón "Recalcular todo" en settings que TRUNCATE + re-evalúa desde cero todos los PRs y badges, para casos extremos.

- **Pros**: lecturas rápidas en el día a día; detección de PR en el momento exacto; corrección posible sin perder el histórico de cuándo se desbloqueó algo; flag dirty permite recálculos selectivos.
- **Contras**: más complejidad que A o B; hay que implementar el proceso de recálculo; el flag dirty añade un campo a cada tabla.

### D. Status quo (no hacer nada)

- **Pros**: cero esfuerzo.
- **Contras**: los logros no funcionan, los PRs no se detectan en tiempo real, la experiencia del usuario no mejora.

## Decisión

Optamos por **C. Híbrido con flag dirty**.

Gana porque:
- Satisface D1 (feedback en tiempo real al completar un set): el mismo flujo que persiste el set puede evaluar PR y badges antes de responder al usuario.
- Satisface D2 (corrección posible): si se borra o edita un workout, se marcan dirty los registros afectados y un proceso de recálculo los repara.
- Satisface D3 (velocidad de lectura): leer `personal_records` y `badge_state` es una query por fila, no un agregado sobre miles de sets.
- Satisface D4 (single source of truth): `Set` nunca se sobreescribe. Los PRs y badges siempre pueden validarse contra los sets si hay dudas.

## Consecuencias

**Positivas:**
- El usuario ve PRs y badges al instante de completar un set.
- Las consultas de perfil (mejor marca, logros) son instantáneas incluso con años de datos.
- Si algo se corrompe, hay camino de reparación sin perder el historial de cuándo se logró algo.
- El botón de recálculo masivo en settings da tranquilidad.

**Negativas / aceptadas:**
- Dos tablas nuevas (`personal_records`, `badge_state`) que mantener.
- El flag `dirty` añade un campo a cada tabla y lógica de "marcar como dirty" al editar/borrar workouts.
- El recálculo batch hay que implementarlo bien para no bloquear la UI.

**Riesgos / a vigilar:**
- Si en el futuro hay muchos usuarios y el recálculo batch se vuelve lento, podría necesitarse un worker en background. Por ahora (single user local) no es problema.
- El flag dirty es un contrato de software: quien modifique un workout histórico debe acordarse de marcar dirty. Hay que encapsularlo en el caso de uso, no dejarlo como responsabilidad de quien llama.

## Modelo de datos

### personal_records

```sql
CREATE TABLE personal_records (
  exercise_id  TEXT NOT NULL,
  pr_type      TEXT NOT NULL,  -- 'max_weight' | 'best_e1rm' | 'best_session_volume'
  value        REAL NOT NULL,  -- kg, e1rm estimado, o volumen (kg × reps)
  weight       REAL,           -- peso del set donde ocurrió
  reps         INTEGER,        -- reps de ese set
  workout_id   TEXT NOT NULL,
  set_number   INTEGER NOT NULL,
  achieved_at  INTEGER NOT NULL, -- timestamp_ms
  dirty        INTEGER NOT NULL DEFAULT 0, -- 0 = limpio, 1 = pendiente de recálculo
  created_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  PRIMARY KEY (exercise_id, pr_type)
);
```

- Un solo PR por tipo por ejercicio. Si se supera, se actualiza la fila (nuevo valor, nuevo workout/set, dirty = 0).
- `best_session_volume` = `SUM(weight × reps)` de todos los sets de ese ejercicio en un mismo workout (no de un set individual).

### badge_state

```sql
CREATE TABLE badge_state (
  badge_id     TEXT NOT NULL PRIMARY KEY,
  state        TEXT NOT NULL DEFAULT 'locked',  -- 'locked' | 'unlocked' | 'featured'
  unlocked_at  INTEGER,  -- timestamp_ms, NULL si locked
  notified     INTEGER NOT NULL DEFAULT 0,      -- 0 = no notificado, 1 = ya se mostró notificación
  dirty        INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
```

- `state` puede volver a `locked` si un recálculo determina que ya no cumple el umbral (ej. se borró el workout que lo desbloqueó).
- `notified` evita que la notificación se muestre cada vez que se abre la app si el badge ya se notificó antes.

## Evaluación de PRs (por set)

Flujo en `logSet` (caso de uso) después de persistir el set:

1. Leer `Set` recién persistido.
2. Para el `exercise_id` de ese set, leer el `personal_record` actual de cada `pr_type`.
3. Comparar:
   - `max_weight`: si `set.weight > record.value` → nuevo PR.
   - `best_e1rm`: si `e1RM(set) > record.value` → nuevo PR.
   - `best_session_volume`: requiere sumar todos los sets del mismo ejercicio en el mismo workout. Si `SUM > record.value` → nuevo PR.
4. Si hay nuevo PR: UPSERT en `personal_records` con el nuevo valor, dirty = 0.

## Evaluación de badges (por set)

Flujo después de evaluar PRs:

1. Reunir datos actualizados: `personal_records`, `workouts` completados, volumen total, streaks, etc.
2. Para cada badge en `badge_state`:
   - Evaluar su condición contra los datos actuales.
   - Si cambió de `locked` a `unlocked`: actualizar `state`, poner `unlocked_at`, `notified = 0` (para que la UI muestre la notificación).
   - Si cambió de `unlocked` a `locked` (recálculo): actualizar `state`, poner `unlocked_at = NULL`, `notified = 0`.
3. Devolver lista de badges recién desbloqueados para que la UI muestre notificación.

## Badges iniciales

Se implementan 3 badges en este ADR. El resto se añaden después sin necesidad de nuevo ADR (son datos, no arquitectura).

| badge_id | nombre | condición | consume |
|---|---|---|---|
| `first-step` | Primer paso | Primer workout con `finished_at IS NOT NULL` | `workouts` |
| `club-100` | Club de los 100 | `personal_records` donde `exercise_id = 'press-banca'` y `pr_type = 'max_weight'` y `value >= 100` | `personal_records` |
| `half-ton` | Media tonelada | Volumen total acumulado (todos los ejercicios, todos los workouts) >= 500 kg | query SUM sobre `sets` (o columna derivada en `user_stats`) |

## Archivos previstos

```
features/achievements/
├── domain/
│   ├── badge.ts              ← existe: Badge, BadgeState
│   ├── badge-catalog.ts      ← existe: catálogo hardcodeado (añadir condiciones)
│   ├── badge-evaluator.ts    ← NUEVO: evalúa cada badge contra datos actuales
│   └── progression.ts        ← existe: XP, niveles, tiers
├── application/
│   ├── evaluate-badges.ts    ← NUEVO: caso de uso, orquesta evaluación post-set
│   └── recalculate-badges.ts ← NUEVO: barre dirty badges y recalcula
├── adapters/
│   ├── schema.ts             ← NUEVO: tabla badge_state en Drizzle
│   └── drizzle-sqlite-badge-repo.ts ← NUEVO: implementación del port
├── ports/
│   └── badge-repo.ts         ← NUEVO: interfaz del repositorio
└── ui/
    └── components/           ← existe: badge-grid, badge-tile, badge-detail-modal, xp-bar

features/personal-records/      ← NUEVO slice (o dentro de achievements si prefieres)
├── domain/
│   ├── personal-record.ts    ← NUEVO: tipo PersonalRecord, prTypes
│   └── pr-evaluator.ts       ← NUEVO: detecta si un set es nuevo PR
├── application/
│   ├── evaluate-prs.ts       ← NUEVO: caso de uso, evaluar PRs de un workout/set
│   └── recalculate-prs.ts    ← NUEVO: barre dirty records y recalcula desde sets
├── adapters/
│   ├── schema.ts             ← NUEVO: tabla personal_records en Drizzle
│   └── drizzle-sqlite-pr-repo.ts ← NUEVO: implementación del port
└── ports/
    └── personal-record-repo.ts ← NUEVO: interfaz del repositorio
```

## Referencias

- [ADR-0006](0006-modelo-pr-y-streak.md) — **sección 3 superceded** por este ADR. El resto (fórmulas e1RM, modelo de streak) sigue vigente.
- [ADR-0003](0003-modelo-set-y-workout.md) — modelo de Set y Workout, base de datos para PRs y badges.

---

[← 0008](0008-db-init-sqlite-provider.md) · [Índice](README.md)
