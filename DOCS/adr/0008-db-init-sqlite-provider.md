# 0008 — Inicialización de DB con SQLiteProvider (async-safe en web)

- **Status**: Accepted
- **Fecha**: 2026-05-29
- **Deciders**: Javier (decisión final) + Claude (sparring + implementación)

## Contexto

La primera versión de `db/connection.ts` abría la base de datos al **cargar el módulo**:

```ts
const sqlite = SQLite.openDatabaseSync('rawsets.db');
export const db = drizzle(sqlite, { schema: {...} });
```

En móvil (SQLite nativo) funciona perfecto — la apertura es síncrona de verdad. En **web**, `expo-sqlite` envuelve `wa-sqlite` (WebAssembly) en un wrapper "síncrono" que internamente usa un Web Worker + `SharedArrayBuffer` + `Atomics.wait` para emular la API sync.

Resultado: al cargar el módulo, el wrapper síncrono dispara un **busy-loop** esperando la respuesta del worker. Si el worker aún no ha terminado de bootstrap (cargar el WASM, montar OPFS, registrar listeners), el loop trip a "Sync operation timeout" hardcodeado en `expo-sqlite/web/WorkerChannel.ts`. La app web cae antes de renderizar nada.

Inicialmente probamos paliativos:
- Configurar Metro para resolver `.sql` y `.wasm` → resuelve bundling, no runtime.
- Añadir cabeceras COOP/COEP para `SharedArrayBuffer` → resuelve permisos, no timing.

El problema raíz no es de bundler ni de seguridad: es de **patrón de inicialización**. Abrir DB a nivel de módulo asume sync verdadero. En web, eso no se sostiene.

## Decision drivers

- **D1. Soporte de web requerido**: la app es PWA-ready desde día 1 (ficha técnica). Móvil es el target primario pero web no es opcional.
- **D2. Sin partir la API**: el dominio y los adapters esperan un `Db` tipado de Drizzle, no quieren saber si bajo el capó es sync o async.
- **D3. Inicialización después de mount**: cualquier patrón "después del primer render" da tiempo al worker WASM a estabilizarse antes de la primera query.
- **D4. Sin componer dos drivers**: tener dos `connection.web.ts` / `connection.native.ts` distintos significa dos versiones del bootstrap (migrations + seed) a mantener.
- **D5. Patrón ya soportado**: Expo provee `SQLiteProvider` precisamente para este caso — abre la DB de forma async-safe dentro del árbol React.

## Decisiones

### 1. La DB se abre dentro del árbol React, no al cargar el módulo

`connection.ts` deja de crear la instancia de `db`. Solo exporta el `schema` (catálogo de tablas) y las `migrations`. La instancia viva se construye dentro de `db-provider.tsx`:

```tsx
<SQLiteProvider databaseName="rawsets.db">
  <DbReadyGate>
    {/* aplica migrations, corre bootstrap, expone db por contexto */}
    {children}
  </DbReadyGate>
</SQLiteProvider>
```

- En móvil, `SQLiteProvider` abre el archivo síncrono real — sin overhead.
- En web, abre vía `openDatabaseAsync` y entrega el handle solo cuando el worker está listo.

### 2. El `db` tipado de Drizzle se inyecta por React Context

Se elimina el singleton de módulo (`db/repos.ts`). En su lugar, cualquier componente que necesite la DB usa el hook `useDb()` proporcionado por `DbProvider`:

```tsx
const db = useDb();
const repo = useMemo(() => new DrizzleSqliteRoutineRepo(db), [db]);
```

**Por qué hook+context y no provider de cada repo**:
- Los repos son tan baratos de instanciar (un constructor con una referencia) que crear uno por componente con `useMemo` es trivial.
- El context global de repos crecería con cada slice (`useExerciseRepo`, `useRoutineRepo`…) y exigiría un provider en árbol por cada uno.
- Lo único que realmente debe ser singleton es la conexión a la DB. Los repos son adapters delgados.

### 3. Migrations + bootstrap viven dentro de `DbReadyGate`

`useMigrations(db, migrations)` aplica los SQL pendientes. `useEffect(dbReady)` corre la siembra del catálogo y el `getOrCreateProfile`. El árbol hijo solo renderiza si ambas fases salieron OK.

```tsx
const { success, error } = useMigrations(db, migrations);
useEffect(() => {
  if (!success || Platform.OS === 'web') return;
  // bootstrap perfil singleton + seed ejercicios
}, [success, db]);
if (error) return <ErrorScreen />;
if (!success) return null;
return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
```

### 4. Seed se salta en web (deuda explícita)

En web, las queries van por el mismo wrapper sync wa-sqlite que dispara timeouts en ciertos patrones (SELECT + INSERT en transacción). La migration corre porque es un único `exec` con DDL, pero el seed dispara la ruta problemática.

Decisión: **no sembrar en web** por ahora. La app web carga visualmente con DB vacía. Cuando se necesite paridad real, se reescribirá la siembra para usar las APIs **async puras** de `expo-sqlite` (`runAsync`, `getAllAsync`) que no van por el sync wrapper.

## Consecuencias

**Positivas:**
- **Web funciona** sin tocar bundler ni headers (los que ya pusimos quedan, son requisitos paralelos).
- **Móvil sigue idéntico** en rendimiento — `SQLiteProvider` usa la API sync nativa cuando puede.
- **Una sola codebase de DB init**: `connection.ts` agnóstico + `db-provider.tsx` con el lifecycle. Cero ramas `Platform.OS` para abrir la DB.
- **Bootstrap explícito en árbol React**: errores de migration se renderizan en una pantalla amistosa en vez de crashear el bundle.
- Patrón composable: si llegan más providers (Auth, Analytics, etc.), encajan al lado.

**Negativas / aceptadas:**
- La DB no está disponible **antes** del primer render. Cualquier import de módulo que espere `db` en top-level falla. Toca pasarlo siempre vía `useDb()`. En la práctica, el dominio se diseñó así desde el principio (use cases reciben repos), no hay regresión.
- Web tiene la deuda del seed (apuntada explícita en `db-provider.tsx`). Mientras no se haga, web es solo "demo visual", no DB funcional.
- Los repos se instancian per-componente con `useMemo`. Trivial pero menos elegante que un singleton de módulo.

**Riesgos / a vigilar:**
- Si llega un componente que necesita queries antes del `DbReadyGate`, hay que reordenar el árbol. La regla mental: cualquier consumidor de DB debe estar como descendiente de `DbProvider` en `_layout.tsx` raíz.
- El `Platform.OS === 'web'` skip del seed asume que web no usa el catálogo. Si una pantalla web futura lo consulta, verá una lista vacía. Hay que documentar (hecho).

## Implementación

Cambios físicos:

- `apps/mobile/src/db/connection.ts` → solo exporta `schema`, `migrations`, `type Db`.
- `apps/mobile/src/db/repos.ts` → **eliminado**. Los repos se instancian per-componente.
- `apps/mobile/src/db/db-provider.tsx` → **nuevo**. SQLiteProvider + Drizzle context + migrations + bootstrap (profile + seed).
- `apps/mobile/src/app/_layout.tsx` → envuelve la app con `<DbProvider>` después de cargar fuentes.

Consumidores típicos:

```tsx
function Screen() {
  const db = useDb();
  const repo = useMemo(() => new DrizzleSqliteXyzRepo(db), [db]);
  // useEffect con repo, useState con resultados, etc.
}
```

## Cuando reabrir este ADR

- Si la deuda del seed en web bloquea una feature → reescribir adapters para usar `runAsync`/`getAllAsync` puros, y reactivar el seed en web.
- Si aparece la necesidad de queries a nivel de módulo (ej. configuración leída antes de cualquier render) → considerar materializar el bootstrap en un script externo (Node) que pre-rellene la DB en el build, no en runtime.

---

[← 0007](0007-auth-supabase-google.md) · [Índice](README.md) · [Siguiente → 0009](0009-prs-y-badges.md)
