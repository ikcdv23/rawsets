# 0002 — Modelo de Exercise y cálculo del balance muscular

- **Status**: Accepted
- **Fecha**: 2026-05-28
- **Deciders**: Javier (decisión final) + Claude (sparring)

## Contexto

El radar de balance muscular es el diferenciador de RAWSETS. Pero los schemas Drizzle de [`features/exercises`](../../apps/mobile/src/features/exercises/adapters/schema.ts), [`features/routines`](../../apps/mobile/src/features/routines/adapters/schema.ts) y [`features/workouts`](../../apps/mobile/src/features/workouts/adapters/schema.ts) se commitearon antes de cerrar el modelo de dominio. Tres preguntas quedaban implícitas en el código sin haberse decidido conscientemente:

1. ¿Cómo es el catálogo de ejercicios? ¿Cerrado, libre, mixto?
2. ¿Quién define los `weight` por grupo muscular y son editables?
3. ¿Cómo se calcula el balance del radar a partir de esos weights?

Sin un modelo claro, cada feature que toque el radar acabaría inventando su propia interpretación de los datos.

## Decision drivers

- **D1. Diferenciador**: el radar es la razón de ser de RAWSETS. Su semántica debe ser robusta y no engañar.
- **D2. Honestidad del dato vs. interpretabilidad de la UI**: el dato bruto debe ser fiel a la realidad física; la UI puede transformarlo para que sea legible.
- **D3. Reversibilidad**: prefiero almacenar más información de la que muestro hoy a almacenar menos y arrepentirme al evolucionar.
- **D4. Aprendizaje progresivo**: los targets por grupo arrancan con estimaciones; el sistema debe permitir ajustarlos por usuario en Fase 2 sin migrar.
- **D5. Estimaciones inevitables**: los weights de cada ejercicio son inferencias, no medidas. El modelo no debe amplificar errores de estimación.

## Decisiones

### 1. Catálogo mixto

El catálogo de ejercicios es **mixto**: la app trae una lista curada (Press banca, Sentadilla, etc.) y el usuario puede añadir los suyos (`isCustom = true`).

**Alternativas descartadas:**
- *Cerrado*: limita ejercicios accesorios y máquinas específicas de cada gimnasio.
- *Totalmente libre*: el usuario hace mucho trabajo inicial; la app pierde el valor de aportar conocimiento curado.

### 2. Equipment categorizado

Cada ejercicio tiene un campo `equipment` con lista cerrada: `barra | mancuerna | peso-corporal | máquina | polea | otro`.

**Por qué**: permite filtros ("ejercicios sin barra" cuando el gimnasio está lleno) y abre la puerta a sugerencias por equipamiento disponible en Fase 2. Migrar más adelante a un schema con `equipment` cuesta más que añadirlo ya.

### 3. Weights editables, suma libre

Cada ejercicio define qué grupos musculares trabaja y con qué intensidad (`weight` entre 0 y 1 por grupo).

- Los curados traen weights por defecto del seed.
- El usuario **puede editarlos** en cualquier momento. No hay "resetear a default" en Fase 1.
- **La suma de los weights de un ejercicio puede pasar de 1**. Un compuesto pesado como Sentadilla puede ser `(cuad 1.0, glúteo 0.3, isquios 0.2, core 0.2) = suma 1.7` porque genuinamente fatiga más músculo total que un Curl bíceps `(bíceps 1.0) = suma 1.0`.

**Alternativas descartadas:**
- *Curados no editables*: garantizaba consistencia entre usuarios, pero RAWSETS es local-first single-user en Fase 1 — esa consistencia aún no tiene a quién servir.
- *Solo grupo primario sin weights*: simplifica el modelo pero hace el radar tonto (un Press banca solo contaría para pecho, ignorando hombro y tríceps).
- *Suma normalizada (=1)*: más fácil de leer en abstracto, pero pierde información sobre cuánto fatiga total genera cada ejercicio, y obliga a renormalizar mentalmente al estimar.

### 4. Storage bruto + normalización en display (target por grupo)

- En la DB y el dominio: se guarda **el valor bruto** acumulado por grupo: `Σ (set.volume × weight_del_grupo)` sobre los sets de la ventana de tiempo.
- En el radar: cada eje muestra **% del target específico de ese grupo**, no porcentaje del máximo entre grupos.

Los targets son constantes hardcodeadas en el dominio, basadas en heurísticas de literatura científica (Schoenfeld, Renaissance Periodization) sobre volumen recomendado por 14 días:

```ts
const MUSCLE_TARGETS: Record<MuscleGroup, number> = {
  pecho: 8000, espalda: 8000, cuadriceps: 8000,        // grupos grandes
  hombro: 5000, gluteo: 5000, isquios: 5000,           // medios
  biceps: 3000, triceps: 3000, antebrazo: 3000,        // pequeños
  pantorrilla: 3000, core: 3000,
};
```

**Por qué `target por grupo` y no `% del máximo del usuario`**: como un grupo grande (cuádriceps) siempre acumulará más puntos brutos que uno pequeño (bíceps) por física pura, normalizar contra el máximo dejaría al bíceps perpetuamente "bajo" aunque se esté entrenando bien. Con targets por grupo, "balanceado" significa **cada grupo cumple su propio listón**, no "todos los números son iguales".

**Patrón aplicado**: *store raw, normalize on read*. Los cálculos del dominio devuelven brutos; la capa de presentación los transforma. Si en el futuro cambia la fórmula (incluir RPE, ponderar series cercanas al fallo, etc.), se cambia sin migrar la DB.

## Consecuencias

**Positivas:**
- El dato persistido es honesto y reversible: cualquier vista futura (gráfico absoluto, alertas semanales, comparativa con histórico personal) puede leerse del mismo bruto.
- El radar tiene una semántica clara: "% de tu target en este grupo".
- El usuario puede ajustar weights si discrepa con los defaults sin contaminar el schema.
- Los `MUSCLE_TARGETS` viven como **constantes de dominio**, no en DB — accesibles a la UI sin query, testables sin mocks, y portables al backend de Fase 2.

**Negativas / aceptadas:**
- Los targets iniciales son estimaciones. Un usuario que entrene mucho más que el promedio verá ejes saturados al 100% sistemáticamente. Mitigable en Fase 2 con targets personalizados por usuario.
- "Suma libre" hace que un usuario con muchos compuestos vea un radar globalmente más "lleno" que uno que prefiere aislamientos. Es un sesgo real de fatiga, pero conviene tenerlo claro al interpretar.
- Sin "reset to default" de weights: si el usuario destroza los porcentajes de un ejercicio curado, debe restaurarlos a mano o reinstalando el seed.

**Riesgos / a vigilar:**
- Si en Fase 2 se decide compartir radar entre usuarios (leaderboards, comparativas), los weights editables generan ruido. Habría que decidir si se snapshottean los del seed para los cálculos públicos o se exige un radar normalizado distinto al privado.
- Los `MUSCLE_TARGETS` son números mágicos que necesitan justificación al revisarse. Convendrá citar la fuente (literatura) inline cuando se persistan en el código.

## Implementación esperada

Tras este ADR, los schemas existentes (`exercises`, `exerciseMuscleGroups`) son compatibles. Cambios necesarios:

1. Añadir columna `equipment` a `exercises`.
2. Mover los `MUSCLE_TARGETS` a `features/exercises/domain/muscle-targets.ts` (junto a `muscle-groups.ts`).
3. Crear la función pura `balanceFor(group, sessions)` en el dominio cuando exista el slice del radar real.

---

[← 0001](0001-arquitectura.md) · [Índice](README.md) · [Siguiente → 0003](0003-modelo-set-y-workout.md)
