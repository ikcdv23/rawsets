# 0006 — Modelo de PR y Streak (derivados)

- **Status**: Accepted
- **Fecha**: 2026-05-28
- **Deciders**: Javier (decisión final) + Claude (sparring)

## Contexto

El Home muestra "PRs · mes" como KPI y una racha implícita en el calendario. Ambos son **conceptos derivados** — no entidades del dominio con identidad propia, sino funciones puras sobre los datos primarios (`Set`, `Workout`, `ScheduledSession`).

Falta cerrar:
1. Qué tipos de PR existen, cómo se calculan, cuándo se exponen.
2. La fórmula exacta de la racha, completando la tabla parcial del [ADR-0004](0004-modelo-routine-y-calendario.md).

## Decision drivers

- **D1. No materializar lo derivable**: si `Set` es la fuente de verdad, los PRs y la racha se calculan sobre ella. Nada de tablas espejo en Fase 1.
- **D2. Funciones puras testables**: ambos cálculos viven en el dominio sin tocar IO, testables en milisegundos.
- **D3. Precisión razonable**: las fórmulas no tienen que ser perfectas, pero sí justificables.
- **D4. Performance Fase 1**: dataset pequeño (un usuario, miles de sets como mucho). Recomputar al vuelo es viable. Si más adelante hace falta, se cachea.

## Decisiones

### 1. Tipos de PR expuestos

Para cada ejercicio, dos PRs distintos:

```ts
type ExercisePRs = {
  byRepCount   : Map<number, Set>;   // mejor peso por número exacto de reps
  bestE1RM     : { set: Set; e1RM: number };  // mejor 1RM estimado de cualquier set
};
```

- `byRepCount`: el mejor peso del usuario para cada número exacto de reps que haya hecho. Si nunca ha hecho 7 reps, no hay entrada para 7. UI muestra los más populares (1, 3, 5, 8, 10, 12).
- `bestE1RM`: el set con mayor 1RM estimado entre todos los sets del ejercicio.

**Alternativa descartada**: PR por *rango* de reps (1–5, 6–8, 9–12). Útil para periodización pero menos intuitivo y añade complejidad. Posponible.

### 2. Fórmula de e1RM — promedio de tres clásicas

```ts
const epley    = (w: number, r: number) => w * (1 + r / 30);
const brzycki  = (w: number, r: number) => w / (1.0278 - 0.0278 * r);
const lombardi = (w: number, r: number) => w * r ** 0.10;

const e1RM = (set: Set) => (
  epley(set.weight, set.reps) +
  brzycki(set.weight, set.reps) +
  lombardi(set.weight, set.reps)
) / 3;
```

**Por qué tres y promedio**:
- Cada fórmula tiene sesgos: Epley sobrestima rangos altos, Brzycki es agresiva, Lombardi conservadora.
- El promedio amortigua errores individuales sin pretender precisión científica.
- Si en el futuro se quiere afinar (regresión personalizada por usuario), la función pura se cambia sin tocar datos.

**Caveat conocido**: ninguna fórmula es válida más allá de ~15 reps. La función puede aplicarse pero el resultado pierde sentido. Para Fase 1 no se filtra; en UI, mostrar el e1RM solo cuando `reps <= 12` (umbral configurable).

### 3. PR como "se computa, no se almacena"

No hay tabla `prs`. La función `computePRs(exerciseId, sets)` devuelve el objeto `ExercisePRs` al vuelo.

**Por qué no materializar**:
- Dataset pequeño (un usuario, <10k sets al año). Recomputar es trivial.
- Tabla `prs` introduce el problema de invalidación: si edito un set antiguo, hay que recalcular o quedará obsoleto. Más complejidad que valor.
- Si en Fase 2 el cómputo se vuelve costoso (muchos años de datos, varios usuarios), se materializa como caché derivado de los sets. ADR de supersede entonces.

### 4. Fórmula de la racha

**Estado del día (función pura sobre el calendario y los workouts):**

| `ScheduledSession` | `Workout` ese día | Estado |
|---|---|---|
| `routineId` = rutina | Existe | ✅ Cumplido |
| `routineId` = rutina | No existe | ❌ Roto |
| `routineId` = NULL (descanso) | No existe | ✅ Cumplido (descanso ejecutado) |
| `routineId` = NULL (descanso) | Existe | ✅ Cumplido (bonus tras modal — ver ADR-0004) |
| Sin `ScheduledSession` | Existe | ✅ Cumplido (actividad sin plan cuenta) |
| Sin `ScheduledSession` | No existe | ◯ Neutral (no rompe, no suma) |

**Racha actual:**
- Recorre los últimos N días desde *hoy* hacia atrás.
- Cuenta días consecutivos en estado ✅, ignorando ◯ neutros (los salta transparente).
- Para cuando encuentra un ❌. Ese día no se incluye.

**Mejor racha:**
- Mismo recorrido pero sobre todo el histórico.
- Guarda el run más largo de ✅ consecutivos (con neutros transparentes).

**Ejemplo:**
```
Día:    L  M  Mi J  V  S  D
Estado: ✅ ◯  ✅ ✅ ❌ ✅ ✅
                ↑ aquí rompe
Racha actual = 0 (porque hoy=Domingo, ayer=Sábado: ✅✅, pero el viernes ❌ corta hacia atrás)
                Espera — re-leer: hoy=D, racha cuenta hacia atrás desde hoy.
                D=✅, S=✅, V=❌ → racha = 2.
Mejor racha   = el run máximo: Mi+J=2 con neutros transparentes (◯ M no rompe) → L,Mi,J = 3 transparente.
```

### 5. Ambos viven en el dominio, sin estado

```
features/workouts/domain/prs.ts          # computePRs, e1RM
features/scheduling/domain/streak.ts     # computeStreak, dayState
```

Funciones puras. La UI (Home, perfil) las llama y cachea el resultado en memoria si hace falta. Sin reactividad mágica.

## Consecuencias

**Positivas:**
- Cero tablas nuevas. El dominio derivado no contamina la persistencia.
- Las fórmulas son testables en aislamiento (golden tests con datasets sintéticos).
- Cambiar la racha o el cálculo de PR a posteriori = cambiar funciones puras, sin migraciones.
- El usuario que edita un set ve sus PRs recalculados sin coordinación adicional.

**Negativas / aceptadas:**
- Si el dataset crece mucho (años de uso, decenas de miles de sets), recomputar PRs en cada render se vuelve lento. Mitigación: memoización + selective recomputation. ADR de supersede solo si pinta.
- La racha actual asume "hoy" como ancla. Cambios de zona horaria o de fecha local pueden corromperla. Hay que normalizar a una zona de referencia (probablemente la del dispositivo, persistida en `UserProfile.timezone` cuando exista — no urgente).
- El promedio de tres fórmulas de e1RM no es más "correcto" que una sola — es solo más robusto contra sesgos individuales. Quien busque precisión publicará un test con datos reales.

**Riesgos / a vigilar:**
- Si en Fase 2 entra notificación push ("¡Has roto un PR!"), eso obliga a detectar el evento en escritura, no en lectura — necesitará un mecanismo de "comparar nuevo set contra los anteriores" al insertar. Esa lógica vive en el caso de uso, no en la query de PRs.

## Implementación esperada

Funciones puras en:

- `features/workouts/domain/prs.ts`:
  - `epley`, `brzycki`, `lombardi` — primitivas.
  - `e1RM(set: Set): number` — promedio.
  - `computePRs(exerciseId: string, sets: Set[]): ExercisePRs`.

- `features/scheduling/domain/streak.ts`:
  - `type DayState = '✅' | '❌' | '◯'`.
  - `dayState(date: Date, sched?: ScheduledSession, wk?: Workout): DayState`.
  - `currentStreak(days: DayState[]): number`.
  - `bestStreak(days: DayState[]): number`.

Ningún cambio en schema.

---

[← 0005](0005-modelo-user-profile.md) · [Índice](README.md) · [Siguiente → 0007](0007-auth-supabase-google.md)
