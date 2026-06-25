# 0005 — Modelo de UserProfile

- **Status**: Accepted
- **Fecha**: 2026-05-28
- **Deciders**: Javier (decisión final) + Claude (sparring)

## Contexto

Tres piezas previas del dominio ([ADR-0002](0002-modelo-exercise-y-balance-muscular.md), [ADR-0003](0003-modelo-set-y-workout.md), [ADR-0004](0004-modelo-routine-y-calendario.md)) referencian un usuario sin haberlo modelado:

- ADR-0002: los `MUSCLE_TARGETS` son globales pero en Fase 2 querrán personalizarse por usuario.
- ADR-0003: dejó el cálculo de volumen para ejercicios body-weight diferido hasta tener `userProfile.bodyWeight`.
- ADR-0004: el tip de día de descanso depende del `goal` del usuario.

Toca cerrar UserProfile.

## Decision drivers

- **D1. Local-first single-user**: la app es para uso personal, no multi-cuenta. Una fila por dispositivo.
- **D2. Onboarding mínimo, no encuesta**: pedir 15 campos al registrarse mata la primera impresión. Pero registrar lo justo para que las features funcionen.
- **D3. Reversibilidad**: añadir un campo nullable cuesta poco; quitarlo cuesta migrar. Preferir nullable a no-existir.
- **D4. Cierra deudas técnicas declaradas**: el `bodyWeight` desbloquea body-weight exercises (ADR-0003).

## Decisiones

### 1. Tabla singleton

`user_profile` es una tabla de una sola fila. El `id` es siempre la constante `'me'` (string fijo). No hay concepto de "usuarios" plural; la app entera asume "yo, en este dispositivo".

**Por qué no key-value (`settings`)**: aunque más flexible, pierde tipado y obliga a parsear/validar cada lectura. Una tabla estructurada con columnas tipadas es más DDD-friendly y más fácil de testear.

**Por qué no AsyncStorage / MMKV**: el perfil necesita estar disponible al mismo nivel que el resto del dominio (Workouts, Sets) para queries y joins futuros. Tenerlo en SQLite junto al resto evita dos fuentes de verdad.

### 2. Campos finales

```ts
UserProfile {
  id           : 'me'              // PK, valor constante
  displayName  : string?           // iniciales del avatar, opcional
  goal         : Goal              // mass | strength | loss | maintenance | general
  unit         : Unit              // kg | lb (display)
  bodyWeight   : real?             // kg — null hasta que onboarding lo capture
  birthDate    : date?             // null hasta que onboarding lo capture
  sex          : Sex?              // male | female | other — null hasta que…
  createdAt    : timestamp_ms
}
```

- `goal` y `unit` con valores **default** al crear el perfil (registro o primer arranque): `general` y `kg` respectivamente. La UI los puede cambiar luego.
- `bodyWeight`, `birthDate`, `sex` son **nullable**: el registro inicial no los exige; el onboarding (o ajustes posteriores) los rellena.
- `displayName` opcional. Si null, el avatar muestra una inicial por defecto (`?` o similar).

### 3. Enums

```ts
type Goal = 'mass' | 'strength' | 'loss' | 'maintenance' | 'general';
type Unit = 'kg' | 'lb';
type Sex  = 'male' | 'female' | 'other';
```

- Los enums viven en el dominio (`features/user/domain/`), no en el schema. El schema los referencia para la `CHECK` constraint o `enum` column.
- `general` cubre al usuario sin objetivo específico (mantener / hacer deporte sin meta concreta).
- `other` en `sex` cubre tanto identidades no binarias como "prefiero no decirlo". Si en el futuro hace falta distinguir, se añade `prefer-not-to-say` sin migrar (es solo otra cadena admitida).

### 4. Cierre del cálculo body-weight (cerraba deuda del ADR-0003)

Ahora que `bodyWeight` existe en el dominio:

```ts
// Función pura en features/workouts/domain/
function setVolume(set: Set, exercise: Exercise, profile: UserProfile): number {
  const effectiveWeight = exercise.isBodyweight
    ? (profile.bodyWeight ?? 0) + set.weight   // bodyWeight + carga externa
    : set.weight;
  return effectiveWeight * set.reps;
}
```

**Caveat**: si `profile.bodyWeight` es null, los ejercicios body-weight tienen volumen 0. La UI debe pedir el peso corporal al usuario antes de que pueda esperar un radar útil — onboarding o un prompt al primer entreno.

**Deuda explícita que se mantiene**: el cálculo usa el `bodyWeight` *actual*. Sets antiguos hechos con un peso distinto recalculan con el peso de hoy. Ver "Riesgos" del ADR-0003. Mitigación futura: tabla `body_weight_history` que permita resolver el peso por fecha.

### 5. Cambio de unidad — conversión pura

```ts
// features/user/domain/units.ts
const KG_TO_LB = 2.20462;
const kgToDisplay = (kg: number, unit: Unit) => unit === 'lb' ? kg * KG_TO_LB : kg;
const displayToKg = (val: number, unit: Unit) => unit === 'lb' ? val / KG_TO_LB : val;
```

Funciones puras, sin estado. La DB y todo el dominio (Set.weight, bodyWeight, targetWeight) **siempre** guardan kg. Solo la capa de presentación convierte a lb si el usuario lo pidió.

## Consecuencias

**Positivas:**
- Slice `features/user` autocontenido con su dominio (`Goal`, `Unit`, `Sex`, funciones puras de unidades) y su adapter Drizzle.
- Cierra la deuda body-weight de ADR-0003: dominadas, fondos, etc. pueden aportar al radar.
- El `goal` desbloquea los tips contextuales del día de descanso (ya diseñados en Home).
- Habilita un onboarding ligero post-registro que rellene los nullables.

**Negativas / aceptadas:**
- El cálculo de volumen body-weight usa el peso actual del usuario, no el histórico. Sets antiguos pueden "valer menos" o "más" tras un cambio importante de peso. Deuda consciente, mitigable con `body_weight_history` cuando sea necesario.
- Aunque `birthDate` y `sex` son nullables y aún no se usan, ya están en el schema. Hay que aguantar la tentación de meterlos en cálculos prematuros sin un ADR que justifique para qué.

**Riesgos / a vigilar:**
- Si en algún momento se pasa a multi-cuenta (sync con backend, perfiles compartidos), la tabla singleton con `id='me'` no escala — habría que migrar a `id UUID` con un campo `isCurrent` o similar. ADR de supersede entonces.
- `MUSCLE_TARGETS` siguen siendo globales (no por usuario). Si Fase 2 los personaliza, las constantes pasan a ser una tabla `user_muscle_targets` referenciando a `UserProfile`.

## Implementación esperada

Nueva slice:

```
features/user/
  domain/
    user-profile.ts       # tipos Goal, Unit, Sex; tipo UserProfile
    units.ts              # kgToDisplay, displayToKg
  adapters/
    schema.ts             # user_profile sqliteTable
```

Cambio en `features/exercises/domain/`:

- (Sin cambios — los `MUSCLE_TARGETS` siguen siendo constante global por ahora.)

Cambio en `features/workouts/domain/`:

- Añadir `setVolume(set, exercise, profile)` como función pura.

Seed inicial:

- Al primer arranque (o tras registro), insertar fila `user_profile` con `id='me'`, `goal='general'`, `unit='kg'`, resto nulls.

---

[← 0004](0004-modelo-routine-y-calendario.md) · [Índice](README.md) · [Siguiente → 0006](0006-modelo-pr-y-streak.md)
