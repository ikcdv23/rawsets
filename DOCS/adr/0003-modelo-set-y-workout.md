# 0003 — Modelo de Set y Workout

- **Status**: Accepted
- **Fecha**: 2026-05-28
- **Deciders**: Javier (decisión final) + Claude (sparring)

## Contexto

`Workout` (la sesión que ocurrió en el tiempo) y `Set` (la serie individual dentro de ella) son la unidad de evento de RAWSETS. Casi todo el resto del dominio se deriva de ellas: el radar, las PRs, el volumen, la racha. Su modelo dicta qué se puede medir y qué no.

El schema actual de [`features/workouts/adapters/schema.ts`](../../apps/mobile/src/features/workouts/adapters/schema.ts) tiene `Workout` y `Set` con campos razonables, pero tres decisiones quedaron implícitas: si se puede entrenar "libre" (sin rutina), si los sets están atados al plan, y si existe un flag `completed` para marcar series planificadas vs hechas.

## Decision drivers

- **D1. Honestidad del dato**: la tabla `sets` debe registrar **lo que ocurrió**, no lo planeado. El plan vive en otro sitio.
- **D2. Match con la realidad del gimnasio**: el entrenamiento real incluye improvisaciones, accesorios fuera del plan, entrenos libres. El modelo no debe penalizarlos.
- **D3. Reversibilidad**: prefiero un modelo que pueda evolucionar a "plan + ejecución" más adelante que uno que mezcle ambos desde el día 1.
- **D4. Simplicidad para Fase 1**: cada flag adicional añade superficie a la UI, a las queries y a los bugs.

## Decisiones

### 1. Workout puede existir sin Routine

`Workout.routineId` es **nullable**. Dos formas válidas de empezar:
- Desde una rutina del catálogo del usuario → `routineId` apunta a la rutina.
- "Entreno libre" → `routineId = null`. El usuario añade sets sobre la marcha.

**Alternativa descartada**: obligar a que todo Workout naciera de una Routine. Habría forzado al usuario a crear una "rutina improvisada" para registrar un entreno espontáneo, fricción innecesaria.

### 2. Los sets de un Workout no están constreñidos al plan

`sets.exerciseId` referencia directamente a `exercises`, no a `routine_exercises`. Un Workout puede tener sets de **cualquier** ejercicio, esté o no en la rutina asociada.

**Por qué**: la rutina es una sugerencia, no una cárcel. Es lo que hace cualquier usuario real — improvisa un acessory al final, se salta un ejercicio porque está la máquina ocupada, añade unos curls porque le apetece.

**Consecuencia**: el sistema puede después calcular "% de cumplimiento del plan" (sets hechos en ejercicios de la rutina ÷ targetSets totales). Esa métrica alimenta la racha. Ver futuro ADR de Streak.

### 3. Los Sets son **eventos reales**, no estados

Se elimina `sets.completed` del schema. Si una fila existe en `sets`, es porque la serie ocurrió. Punto.

**Alternativa descartada**: mantener `completed` como flag y poblar la tabla con las series planificadas al iniciar el entreno (marcándolas completed al hacerlas). Habría mezclado plan y ejecución en la misma tabla, complicando queries y haciendo el modelo menos honesto.

**Las series planificadas siguen existiendo** — pero en `routine_exercises.targetSets` (un contador, no una lista de filas). Al iniciar un entreno, la UI lee ese contador y muestra N slots vacíos. El usuario los va rellenando; cada vez que confirma un set, se inserta una fila en `sets`. No hay "set planificado vacío" persistido.

### 4. Estructura final de Set

```ts
Set {
  id          : uuid
  workoutId   : uuid              // FK CASCADE: borrar workout = borrar sets
  exerciseId  : uuid              // FK RESTRICT: no borrar exercise con sets vivos
  setNumber   : int >= 1          // Nth set de ESE ejercicio en ESE workout
  weight      : real >= 0         // kg (interno, ver CLAUDE.md). 0 vale para body-weight
  reps        : int >= 1          // un set con 0 reps no se registra
  rpe         : real?, 0..10      // opcional, escala RPE estándar
  restSeconds : int? >= 0         // descanso después de este set
}
```

**Invariantes:**
- `reps >= 1` (0 reps = no ocurrió, no se persiste).
- `weight >= 0` (negativo solo tendría sentido para "asistencia", se modela aparte si llega).
- `rpe in [0, 10]` cuando está definido.
- `setNumber` es contador relativo a `(workoutId, exerciseId)`, comienza en 1.

### 5. Estructura final de Workout

```ts
Workout {
  id         : uuid
  routineId  : uuid?              // null = entreno libre
  startedAt  : timestamp_ms       // siempre definido
  finishedAt : timestamp_ms?      // null = en progreso o abandonado
  notes      : text?              // libre, opcional
}
```

**Invariantes:**
- `startedAt` siempre presente.
- Si `finishedAt` no es null → `finishedAt >= startedAt`.
- "En progreso" vs "abandonado" no se distinguen en Fase 1: ambos son `finishedAt = null`. Si se necesita el día de mañana, se añade un estado explícito.

### 6. Ejercicios body-weight: marcador + cálculo diferido

Para que dominadas, fondos, planchas, etc. cuenten en el radar:

- Se añade `exercises.isBodyweight: boolean` (default false).
- Set guarda **solo la carga externa** (0 para dominadas a peso corporal, +10 para dominadas lastradas, −20 para asistidas).
- El cálculo de volumen real para body-weight (`weight_efectivo = bodyWeight_del_usuario + set.weight`) **se difiere hasta el ADR de UserProfile**, cuando exista el campo `userProfile.bodyWeight`.

**Mientras tanto** (hasta UserProfile): los sets body-weight con `weight = 0` aportan volumen 0 al radar. Es deuda técnica explícita y consciente. El dato bruto es honesto; la fórmula de display se actualizará sin tocar la DB.

**Alternativas descartadas:**
- *Diferir todo*: aceptar que body-weight no cuenta hasta nuevo aviso, sin siquiera marcar los ejercicios. Hacía la migración futura más costosa (habría que clasificar todos los ejercicios a posteriori).
- *Guardar carga total*: el usuario introduce `bodyWeight + extra` cada vez. Frágil: cambia su peso → las series antiguas mienten.

## Consecuencias

**Positivas:**
- Tabla `sets` queda como log inmutable de eventos. Queries sencillas, semántica clara.
- Schema flexible para evolucionar: cualquier feature de plan-vs-ejecución (compliance del plan, predicción de descanso, etc.) se construye encima de este log sin migrar.
- Entrenos libres son ciudadanos de primera, no un parche.
- Body-weight tiene un marcador semántico (`isBodyweight`) aunque la fórmula completa llegue después.

**Negativas / aceptadas:**
- Hasta que UserProfile exista, los sets body-weight (`weight = 0`) aportan poco al radar. Aceptable como deuda explícita y revisitable.
- Sin tabla intermedia de "set planificado", la UI tiene que reconstruir los slots vacíos al vuelo desde `routine_exercises.targetSets`. Es trivial pero hay que recordar que no hay "planned sets" como entidad.

**Riesgos / a vigilar:**
- Si alguna feature futura necesita persistir el orden global de sets dentro del Workout (no solo per-exercise), `setNumber` per-exercise se queda corto. Habría que añadir un `orderInWorkout` o usar `createdAt`. No lo añado todavía porque no hay caso de uso real.
- Workouts "huérfanos" sin `finishedAt` se acumularán con uso real. Hace falta una heurística futura (auto-cerrar tras N horas inactivo, o pedir al usuario al volver "¿terminaste este entreno?").

## Implementación esperada

Cambios al schema vs estado actual:

1. **`sets`**: eliminar columna `completed`.
2. **`exercises`**: añadir `isBodyweight: boolean default false`. (Junto con `equipment` del ADR-0002, irían en la misma migración.)
3. Crear constantes / funciones puras en `features/workouts/domain/` para invariantes (validación de Set, cálculo de volumen).
