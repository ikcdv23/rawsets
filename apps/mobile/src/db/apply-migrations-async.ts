import type { SQLiteDatabase } from 'expo-sqlite';

// Migrator manual que NO usa `useMigrations` de drizzle-orm.
//
// Por qué reinventar la rueda: `useMigrations` ejecuta los CREATE TABLE vía
// la API SYNC de expo-sqlite. En web esa API va por un busy-loop sobre
// SharedArrayBuffer que en algunos navegadores/cargas se cuelga indefinidamente
// (mismo síndrome que vimos con el seed). El splash entonces no desaparece.
//
// `execAsync` + `runAsync` van por un canal async distinto que NO se cuelga.
// Resultado: migrations fiables en web, sin tocar nativo (que también va fino
// con esta ruta — la API async es la "buena" para todo el mundo).
//
// Esquema del tracking que usa drizzle (lo mantenemos compatible por si en
// algún momento quieres volver a useMigrations):
//   __drizzle_migrations(id PK, hash TEXT, created_at NUMERIC)
//
// Usamos `entry.tag` como hash en vez del hash sha256 real. Es estable y
// suficiente para idempotencia.

// Shape del objeto que drizzle-kit genera en `drizzle/migrations/migrations.js`.
type JournalEntry = {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
};

type Migrations = {
  journal: { entries: JournalEntry[] };
  migrations: Record<string, string>;
};

export async function applyMigrationsAsync(
  sqlite: SQLiteDatabase,
  migrations: Migrations,
): Promise<void> {
  // 1. Tabla de tracking (idempotente con IF NOT EXISTS).
  await sqlite.execAsync(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL,
      created_at INTEGER
    );
  `);

  // 2. Hashes ya aplicados.
  const applied = await sqlite.getAllAsync<{ hash: string }>(
    'SELECT hash FROM __drizzle_migrations',
  );
  const appliedTags = new Set(applied.map((r) => r.hash));

  // 3. Para cada migration en orden, aplicar si no estaba.
  for (const entry of migrations.journal.entries) {
    if (appliedTags.has(entry.tag)) {
      continue;
    }

    const key = `m${String(entry.idx).padStart(4, '0')}`;
    const sql = migrations.migrations[key];
    if (!sql) {
      console.warn(`[migrations] SQL ausente para ${key}, salto.`);
      continue;
    }

    try {
      // execAsync acepta multi-statement SQL. Los `--> statement-breakpoint`
      // entre CREATE TABLE son comentarios de línea SQL (empiezan con --),
      // SQLite los ignora.
      await sqlite.execAsync(sql);
    } catch (err) {
      const msg = String(err);
      // Si las tablas ya existen (residuos de un useMigrations previo, OPFS
      // persistente entre cambios de migrator), lo tratamos como "ya aplicada"
      // para no bloquear el arranque. La próxima vez se saltará vía el set.
      if (msg.includes('already exists')) {
        console.warn(`[migrations] tablas existentes en ${entry.tag}, marcando como aplicada.`);
      } else {
        throw err;
      }
    }

    await sqlite.runAsync('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)', [
      entry.tag,
      Date.now(),
    ]);
    console.log(`[migrations] aplicada ${entry.tag}`);
  }
}
