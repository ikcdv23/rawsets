# 0004 — Modelo de Routine y programación por calendario

- **Status**: Accepted
- **Fecha**: 2026-05-28
- **Deciders**: Javier (decisión final) + Claude (sparring)

## Contexto

Tras cerrar `Workout` y `Set` ([ADR-0003](0003-modelo-set-y-workout.md)), queda decidir cómo se modela el "plan" del usuario: la rutina como template y el mecanismo que decide *qué toca hoy*. Este último alimenta la racha (ver ADR-0006) y la card "Sesión de hoy" del Home.

Dos preguntas en una:
1. ¿Una `Routine` es una sesión nombrada (Tirón A) o un programa multi-día (PPL 5d)?
2. ¿Cómo se sabe qué se planificó para un día concreto?

## Decision drivers

- **D1. Match con modelo mental del usuario**: la gente piensa "el lunes hago piernas", no "estoy ejecutando el programa X".
- **D2. Flexibilidad ante la vida real**: vacaciones, lesiones, enfermedad. La semana cambia. El modelo no debe obligar a "pausar un programa" para saltarse un día.
- **D3. KISS Fase 1**: cada abstracción nueva (Plan, Programa, Mesociclo) cuesta UI, queries y tests. Si no aporta, fuera.
- **D4. Reusabilidad de la Routine**: una "Push A" puede aparecer en varias estructuras (semana actual, semana copiada, planificación de la siguiente). No debe duplicarse.
- **D5. Soporte para la racha**: el sistema debe saber qué se planeó por día (incluyendo descansos) para calcular adherencia al plan.

## Decisiones

### 1. Routine = una sesión nombrada (no un programa completo)

Una `Routine` representa **una sesión individual** ("Tirón A", "Empuje B", "Día de piernas"). Si el usuario quiere un programa multi-día, lo monta con varias Routines colocadas en el calendario.

**Alternativa descartada**: Routine = programa completo con sub-días dentro. Sobrecargaba el concepto: "Routine" significaría a veces sesión y a veces programa. Mezcla niveles de abstracción y obliga a duplicar sesiones si se reutilizan entre programas.

### 2. `targetReps` como rango min–max

`routine_exercises` añade dos columnas: `targetRepsMin` y `targetRepsMax` (enteros, `>= 1`).

- Si `min == max` → la UI muestra "5 reps".
- Si `min < max` → la UI muestra "8–12 reps".

Cubre tanto fuerza (rangos fijos: 5×5) como hipertrofia (rangos amplios: 8–12). La racha puede comprobar si un set "cumple el plan" (reps dentro del rango).

**Alternativa descartada**: un solo `targetReps` entero. Pierde la semántica de rango, que es estándar en hipertrofia.

### 3. `targetWeight` opcional

Se añade `targetWeight: real | null` a `routine_exercises`. El usuario puede fijar el peso de un set planeado o dejarlo libre.

**Por qué opcional**: la mayoría de usuarios prefieren progresión libre (no actualizar el plan cada semana). Pero hay casos legítimos donde fijar el peso aporta (un 5×5 a 100 kg como objetivo concreto). Tener el campo nullable no fuerza nada.

### 4. Programación por calendario, no por programa

Para saber qué toca un día, se añade una entidad nueva `scheduled_sessions`:

```ts
scheduled_sessions {
  id        : uuid
  date      : date         // UNIQUE — un slot por día como máximo en Fase 1
  routineId : uuid? FK → routines.id ON DELETE SET NULL
                          // null = "descanso planificado"
}
```

Cada fila = "el día `date` el usuario planificó **esto** (una rutina o descanso)". Ausencia de fila = ese día no estaba en el plan (no cuenta ni a favor ni en contra de la racha).

**Acciones del usuario que crean/manipulan `scheduled_sessions`:**
- Asignar una rutina o "descanso" a un día desde el calendario.
- **Repetir semana**: duplicar las `scheduled_sessions` de los últimos 7 días hacia los siguientes 7. Feature crítica — cubre el 90% del uso real ("haz lo mismo que la semana pasada").
- (Fase 2) modal de "planificar semana" para bulk-assign.

**Invariante:** como mucho **1 `ScheduledSession` por fecha**. Si en el futuro alguien quiere dos sesiones en un día (mañana + tarde), se modela aparte.

**Alternativa descartada**: entidad `Plan` con un sequence de rutinas/descansos y flag `isActive`. Más abstracta, más útil para análisis de adherencia "al programa X" — pero introduce un concepto que el usuario no pide y obliga a "activar/pausar planes" cuando la vida cambia. Calendar-driven es más honesto con cómo funciona la realidad. Si el día de mañana se necesita agrupar rutinas en programas, se monta encima.

### 5. Racha — reglas de interacción con el calendario

La fórmula completa de la racha irá en un ADR aparte. Aquí solo se fija el contrato con `scheduled_sessions`:

| `ScheduledSession` ese día | `Workout` ese día | Estado del día |
|---|---|---|
| `routineId` = rutina | Existe | ✅ Cumplido |
| `routineId` = rutina | No existe | ❌ Roto |
| `routineId` = NULL (descanso) | No existe | ✅ Cumplido (rest day cuenta) |
| `routineId` = NULL (descanso) | Existe | ✅ Cumplido (bonus, ver UX abajo) |
| Sin `ScheduledSession` | Existe | ✅ Cumplido (actividad cuenta) — ver [ADR-0006](0006-modelo-pr-y-streak.md) |
| Sin `ScheduledSession` | No existe | Neutral — no rompe ni suma |

**UX expected — confirmación al entrenar en descanso planificado**:

Cuando el usuario intenta empezar un Workout en un día cuyo `ScheduledSession.routineId = null`, la UI muestra un modal de confirmación:

> "Hoy tenías descanso planificado. ¿Continuar con una sesión?"
> `[ Cancelar ]   [ Sé lo que hago ]`

Si confirma, el Workout se registra normalmente y el día sigue marcado como ✅. La fricción del modal protege contra entrenar por inercia sin intención.

## Consecuencias

**Positivas:**
- Modelo mental directo: el usuario "pone cosas en el calendario", no "ejecuta un programa".
- "Repetir semana" cubre la mayoría del caso de uso real con un botón.
- Vacaciones / pausas / cambios = no replicar la semana. Sin "desactivar plan".
- Las rutinas son entidades reutilizables — la misma "Push A" puede aparecer en muchas semanas distintas sin duplicarse.
- El plan vive aparte de la ejecución: borrar un Workout no afecta al `ScheduledSession`, y viceversa.

**Negativas / aceptadas:**
- Métricas como "adherencia al programa PPL desde marzo" no son nativas. Se infieren agrupando rutinas (todas las que contienen "Push" o que comparten patrones), pero no hay un `planId` que las agrupe. Si se necesita, se añade en su momento.
- "Repetir semana" copia tal cual. Progresión semanal automática (subir 2.5 kg en sentadilla cada semana) no la hace solo — será una feature separada.
- El usuario tiene que planificar/replicar cada semana. Más fricción que un "Plan activo" autoreplicado.

**Riesgos / a vigilar:**
- Si el calendario crece (años de uso), `scheduled_sessions` será una tabla grande. Indexar por `date` desde el principio.
- "Repetir semana" cuando ya hay `scheduled_sessions` en la semana destino: decidir si sobreescribe, ignora o pregunta. Inicialmente, **pregunta con modal de confirmación**.
- La invariante "1 sesión por día" es restrictiva. Cuando aparezca el caso "dos sesiones en un día", reabrir este ADR.

## Implementación esperada

Nuevos en schema:

```ts
// apps/mobile/src/features/scheduling/adapters/schema.ts  (carpeta nueva)
scheduled_sessions {
  id        : text PK
  date      : integer NOT NULL UNIQUE      // timestamp_ms (o un date type si soporta)
  routineId : text? FK routines.id ON DELETE SET NULL
  createdAt : integer NOT NULL              // timestamp_ms
}
```

Cambios en schema existente:

- `routine_exercises`: añadir `targetRepsMin INT`, `targetRepsMax INT`, `targetWeight REAL`. Los tres NOT NULL para `min/max` (cualquier sesión planeada lleva reps), nullable para `targetWeight`.

Constantes / funciones puras en dominio:

- `features/scheduling/domain/` — nueva slice.
  - `schedule.ts`: tipo `ScheduledSession` puro, funciones de "repetir semana" (clonado de fechas).
  - El cálculo de día (compliance) llega con el ADR de racha.

---

[← 0003](0003-modelo-set-y-workout.md) · [Índice](README.md) · [Siguiente → 0005](0005-modelo-user-profile.md)
