/**
 * Applies db/migrations/*.sql to the database in DATABASE_URL.
 *
 * Platform-owned plumbing. `npm run db:migrate` is the whole command; the app does not change when a database is
 * connected - server/store.mjs starts using it as soon as DATABASE_URL is set.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const MIGRATIONS_DIR = path.join(process.cwd(), 'db', 'migrations');
const LOCK_ID = 917_000_1;

/**
 * Which files still have to be applied, in the order they must run.
 *
 * Pure, so the rules are testable without a database: only `.sql` files, sorted by name (which is why they are
 * numbered), never one that is already recorded, and a file that carries no statement at all is refused instead
 * of being marked as applied - a migration recorded as done but empty is how a schema quietly goes missing.
 */
export function planMigrations(appliedIds, files) {
  const applied = new Set(Array.isArray(appliedIds) ? appliedIds : []);
  return files
    .map((file) => ({ id: path.basename(file), path: file }))
    .filter((entry) => /\.sql$/.test(entry.id))
    .sort((left, right) => left.id.localeCompare(right.id))
    .filter((entry) => !applied.has(entry.id))
    .map((entry) => ({ ...entry, sql: readFileSync(entry.path, 'utf8') }))
    .filter((entry) => {
      const statements = entry.sql
        .split(';')
        .map((part) => part.replace(/--[^\n]*/g, '').trim())
        .filter(Boolean);
      if (statements.length === 0) throw new Error(entry.id + ' has no statement in it, so it was not applied.');
      return true;
    });
}

/** One connection, handed to both the runner and (in tests) an in-memory Postgres-compatible engine. */
export async function connect(connectionString) {
  const { default: pg } = await import('pg').catch(() => {
    throw new Error(
      'The "pg" package is not installed. Run "npm install pg" (it is optional, because an app with no database does not need it).'
    );
  });
  const client = new pg.Client({ connectionString });
  await client.connect();
  return client;
}

export async function runMigrations(client, only) {
  const files = only || readdirSync(MIGRATIONS_DIR).map((name) => path.join(MIGRATIONS_DIR, name));
  // The ledger may not exist yet - migration 0001 is what creates it - so a database that has never been migrated
  // reports nothing applied rather than failing here.
  const appliedIds = await client
    .query("select to_regclass('public.app_migrations') is not null as present")
    .then((result) => (result.rows[0] && result.rows[0].present ? client.query('select id from app_migrations') : null))
    .then((result) => (result ? result.rows.map((row) => row.id) : []))
    .catch(() => []);
  const pending = planMigrations(appliedIds, files);
  for (const migration of pending) {
    try {
      await client.query('begin');
      await client.query(migration.sql);
      await client.query('insert into app_migrations (id) values ($1)', [migration.id]);
      await client.query('commit');
      console.log('[db] applied ' + migration.id);
    } catch (error) {
      await client.query('rollback').catch(() => undefined);
      throw new Error(migration.id + ' failed: ' + (error && error.message ? error.message : String(error)));
    }
  }
  return pending.length;
}

/** Runs only when this file is the command, so the functions above can be imported by a test. */
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('db.mjs')) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('[db] DATABASE_URL is not set, so there is nothing to migrate. The app keeps its data in server/.data/ until it is.');
    process.exit(1);
  }
  const client = await connect(url);
  try {
    const count = await runMigrations(client);
    console.log(count === 0 ? '[db] already up to date' : '[db] ' + count + ' migration(s) applied');
  } finally {
    await client.end().catch(() => undefined);
  }
}
