# 0001 — Arquitectura: Hexagonal + DDD táctico + Vertical Slicing

- **Status**: Accepted
- **Fecha**: 2026-05-25
- **Deciders**: Javier (decisión final) + Claude (sparring)

## Contexto

RAWSETS es una app local-first multiplataforma (iOS + Android + Web PWA) con cuatro restricciones que pesan sobre la arquitectura:

1. **PWA-ready desde día 1**: persistencia local con dos drivers distintos (`expo-sqlite` en móvil, `sqlite-wasm` en web). El código de aplicación no puede acoplarse a uno de los dos.
2. **Dominio compartido con backend Fase 2**: el cálculo de balance muscular debe poder ejecutarse tanto en el cliente como en el backend Hono que llegará después, sin reescribir.
3. **Aprender arquitectura limpia profesional** es el objetivo primario del proyecto, no solo entregar la app funcional. Eso pesa contra atajos que oculten los conceptos.
4. **UX como first-class**: la fluidez percibida entra en el diseño de cada feature. La arquitectura debe permitir testar lógica de fluidez (optimistic updates, debouncing) en aislamiento.

## Decision drivers

- **D1. PWA-ready**: poder intercambiar SQLite móvil ↔ wasm sin tocar lógica de aplicación.
- **D2. Reutilización Fase 2**: dominio puro extraíble al backend sin arrastrar dependencias móviles.
- **D3. Learning value**: preferir patrones canónicos reconocibles (Hexagonal, DDD, Clean) frente a invenciones ad-hoc.
- **D4. Testabilidad**: lógica pura testable en milisegundos sin mocks.
- **D5. Cognitive load por archivo**: una pieza se debe poder leer sin entender toda la app.
- **D6. Sweet spot 1 dev**: evitar over-engineering (containers de DI, bounded contexts, event sourcing) que ralenticen sin beneficio aquí.

## Alternativas consideradas

### A. Estilo Lumma — 3 capas planas (Action → Service → Repository)
El patrón que Javier ya probó en su proyecto anterior. Service mezcla reglas puras + orquestación.

- **Pros**: simple, familiar, documentado.
- **Contras**: pensado para Next.js (Action = HTTP boundary, que no existe en cliente local). Service con reglas + orquestación mezcladas dificulta D2 y D4.

### B. Hexagonal + DDD táctico + Vertical Slicing (ELEGIDA)
Dominio puro al centro, ports/adapters intercambiables, casos de uso explícitos, organización por feature.

- **Pros**: resuelve D1 estructuralmente; D2 cumplido; patrón canónico (D3); testabilidad nativa (D4); cada capa = una responsabilidad (D5).
- **Contras**: más archivos por feature; curva inicial mayor.

### C. Clean Architecture estricta (Uncle Bob, 4 anillos)
Misma familia que B pero más prescriptiva: Presenters entre Use Case y UI, Interactor-as-class.

- **Pros**: máxima ortodoxia.
- **Contras**: Presenters son ceremonia sin beneficio en React; choca con D6.

### D. Vertical Slice puro (Bogard) sin convenciones internas estrictas
Cada feature decide su estructura interna libremente.

- **Pros**: mínima ceremonia.
- **Contras**: inconsistencia entre features, choca con D5 y D3.

## Decisión

Adoptamos **B: Hexagonal Architecture + DDD táctico ligero, organizado en vertical slices**.

Cumple todos los drivers a la vez. Resuelve PWA estructuralmente (D1). Permite extraer dominio puro al backend Fase 2 (D2). Enseña patrones canónicos con vocabulario establecido (D3). Da testabilidad nativa (D4). Una capa = una responsabilidad reduce carga cognitiva (D5). Sin contenedores ni anillos extra (D6).

## Sub-decisiones cerradas en la discusión (todas con OK explícito)

### D-modelado — Tipos planos + funciones puras (no clases)

Las entidades y value objects se modelan con **branded types + smart constructors + funciones puras**, no con clases.

Razón concreta: los datos cruzan adapter ↔ DB constantemente. Las clases pierden métodos al serializar. Los objetos planos no. Además React es funcional y casa mejor con el grano del framework.

**Excepción**: errores tipados sí usan clases (`class NotFoundError extends Error`), porque necesitan `instanceof` para discriminar.

### D-errores — `Result<Ok, Err>` en toda frontera fallable

Validaciones de dominio, use cases y adapters devuelven `Result`. Los errores forman parte de la firma. `throw` queda reservado a fallos genuinamente inesperados de infraestructura.

### D-reads-writes — Simétrico: todo pasa por Use Case

Tanto lecturas como escrituras atraviesan la capa Use Case. La consistencia gana sobre el ahorro de boilerplate, y el patrón es más fácil de aprender con un solo flujo.

**Smell a vigilar**: si en 6 meses el 80% de los Use Cases de lectura son wrappers de 1 línea sobre el repo, reconsiderar a asimétrico (CQRS-lite) en un ADR de supersede.

### D-domain-frontera — `packages/domain` solo para lo compartido con Fase 2

`packages/domain` reservado para el subset que se compartirá con backend Hono: tipos canónicos, `computeBalance`, enums de grupos musculares. El resto vive en `features/<x>/domain/` del móvil.

### D-DTOs — Sin DTOs en Fase 1

Dos representaciones de datos: `DBRow` (en adapter) ↔ `DomainEntity` (en domain). El adapter mapea entre ambas. DTOs aparecerán solo cuando exista frontera externa real (Fase 2: contrato HTTP del backend; Fase 3: export al servicio ML).

### D-DI — Inyección de dependencias manual con funciones fábrica

`makeLogSet(repo)` retorna la función con sus dependencias cerradas. Sin librería externa (tsyringe, InversifyJS). Suficiente para 1 dev.

## Estructura de carpetas por feature

```
apps/mobile/src/features/<feature>/
├── domain/         # entidades, value objects, funciones puras
├── use-cases/      # uno por intención del usuario
├── ports/          # interfaces (qué necesita la feature del exterior)
├── adapters/       # implementaciones (Drizzle SQLite, WASM, in-memory)
└── ui/             # hooks, screens, componentes de feature
```

**Compartido entre features**:

```
apps/mobile/src/shared/      # errores, Result type, helpers transversales
packages/domain/             # lo que se compartirá con backend Fase 2
```

## Heurística de dial-down

Cada capa se gana su existencia.

- Si una feature **no tiene reglas de negocio** (ej. settings con toggles): puede no tener `domain/`.
- Si una feature **es solo UI sin persistencia** (ej. tutorial inicial): puede no tener `ports/` ni `adapters/`.

Decisión cerrada (D4): los Use Cases sí están siempre, incluso para reads simples.

## Flujo de una acción (referencia)

Ejemplo: el usuario registra un set.

1. **UI** (`SetForm`) → llama al hook `useLogSet()`.
2. **Hook** → resuelve qué Adapter toca según plataforma y devuelve la función de Use Case.
3. **Use Case** (`logSet`):
   - Pide a **Domain** que valide (`validateSet`) → recibe `Result`.
   - Si OK, pide a **Domain** que cree la entidad (`createSet`) → recibe `WorkoutSet`.
   - Pide al **Adapter** (a través del Port) que persista (`repo.appendSet`) → recibe `Result`.
4. **Adapter** convierte entidad → fila, ejecuta Drizzle, devuelve `Result`.
5. El `Result` sube de vuelta hasta la UI, que renderiza el nuevo estado.

**Nota sobre el Port**: el Port (interfaz) no aparece como paso en el flujo de runtime. Es solo el contrato que describe qué métodos puede llamar el Use Case al Adapter. En tiempo de ejecución, el Use Case llama directamente al Adapter; el Port queda como tipo en el código fuente.

### Quién conoce a quién

```
UI               conoce  →  Use Case
Use Case         conoce  →  Domain (puro) + Port (interfaz)
Adapter          conoce  →  Port (lo implementa) + Drizzle/SQLite
Domain           conoce  →  nada exterior
Port             conoce  →  nada (es solo tipos)
```

El **Domain** es lo más estable: no depende de nada. Todo lo demás depende de él. Esa es la idea central.

## Consecuencias

**Positivas**:
- PWA resuelto estructuralmente: dos adapters cumpliendo el mismo Port, mismo Use Case, mismo Domain.
- Tests rápidos sin mocks para todo el dominio puro.
- Dominio del balance muscular extraíble al backend Hono en Fase 2 sin reescribir.
- Vocabulario y patrones canónicos aprendidos en la práctica: Hexagonal, Port, Adapter, Entity, Value Object, Smart Constructor, Result type, DI manual, dependency inversion.
- Una capa = una responsabilidad → diffs limpios, reviews rápidas.

**Negativas (aceptadas conscientemente)**:
- Más archivos por feature (5–7 vs 3 en Lumma). Mitigado por dial-down heuristic.
- Curva inicial: la primera feature cuesta más; el patrón se interioriza al hacerlo.
- Boilerplate de mapeo `DBRow` ↔ `DomainEntity` en cada adapter. Aceptado como coste de aislamiento.
- Use Cases para reads simples pueden quedar como wrappers de 1 línea (smell "Useless Wrapper") — aceptado por consistencia pedagógica.

**Riesgos a vigilar** (candidatos a futuros ADRs de supersede):
- **Over-engineering**: aplicar las 5 capas a features triviales. Mitigación: heurística de dial-down + revisión periódica.
- **Anemic domain**: que las entidades terminen siendo bolsas de datos y toda la lógica caiga en Use Cases. Mitigación: revisar que invariantes y verbos vivan en `domain/`.
- **Leaky abstraction**: detalles de Drizzle filtrándose al dominio o use case. Mitigación: el dominio nunca importa de `adapters/`; los use cases solo importan de `ports/`.
- **Useless wrappers** en reads: si crecen, reconsiderar D4 (simétrico → asimétrico).

## Referencias

- [Alistair Cockburn — Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/) (2005)
- [Robert C. Martin — The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) (2012)
- Eric Evans — *Domain-Driven Design* (2003); Vaughn Vernon — *Implementing DDD* (2013)
- Jimmy Bogard — *Vertical Slice Architecture* (posts y charlas, ~2018)
- [Lumma `docs/concepts/arquitectura.md`](/home/javier/Personal/Lumma/docs/concepts/arquitectura.md) — patrón previo de Javier, referencia y contrapunto.
- [`DOCS/ficha-tecnica.md`](../ficha-tecnica.md) — secciones 4 (stack) y 7 (modelo de datos).
