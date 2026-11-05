/**
 * Where the app's rows live, and the only file that knows.
 *
 * Two drivers, one interface, chosen by the environment: with `DATABASE_URL` set the rows are in that Postgres
 * database, and without it they are one JSON file per collection on this machine. **Replacing this file is how a
 * team takes ownership of its data**; the API above it, the dev command, every screen and `src/lib/data.js` stay
 * exactly as they are.
 *
 * The operations are the app's own shape (`list/get/create/update/remove/replaceAll`) rather than raw reads and
 * writes, because that is what makes a real database usable: an update merges **in the database**
 * (`data || $patch`), so two writers on one record do not lose each other's fields the way a read-modify-write
 * would.
 */
import { mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/** The file driver's ceiling per collection. A database the team owns does not need it; the platform does. */
export const MAX_ROWS = 500;
export const MAX_RESOURCE_BYTES = 200000;
/** One row may never be larger than this, in either driver: a data URI in a row is a bug. */
export const MAX_ROW_BYTES = 200000;
const RESOURCE_PATTERN = /^[a-z][a-z0-9-]{0,23}$/;

/** A collection name is a short lowercase URL segment, so it can never climb out of the data directory. */
export function isResourceName(name) {
  return typeof name === 'string' && RESOURCE_PATTERN.test(name);
}

/** `postgres` as soon as a database is configured, `file` until then. Reported by `GET /api/health`. */
export function storageKind() {
  return process.env.DATABASE_URL ? 'postgres' : 'file';
}

/** Where the collections live when there is no database. `DATA_DIR` is how a host points this at a volume. */
export function dataDir() {
  return process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), 'server', '.data');
}

function fileFor(resource) {
  if (!isResourceName(resource)) throw new Error('Unsafe collection name: ' + resource);
  return path.join(dataDir(), resource + '.json');
}

/** What is wrong with these rows, if anything. Pure, so the limits can be tested. */
export function checkRows(rows) {
  if (!Array.isArray(rows)) return { ok: false, reason: 'The data must be a list of records.', code: 'bad-rows' };
  if (rows.length > MAX_ROWS) {
    return { ok: false, reason: 'A collection can hold at most ' + MAX_ROWS + ' records.', code: 'too-many-rows' };
  }
  for (const row of rows) {
    const single = checkRow(row);
    if (single.ok === false) return single;
  }
  let serialised = '';
  try {
    serialised = JSON.stringify(rows);
  } catch {
    return { ok: false, reason: 'The data contains something that cannot be stored.', code: 'bad-rows' };
  }
  if (Buffer.byteLength(serialised, 'utf8') > MAX_RESOURCE_BYTES) {
    return {
      ok: false,
      reason: 'A collection can hold at most ' + Math.round(MAX_RESOURCE_BYTES / 1000) + ' KB.',
      code: 'too-large',
    };
  }
  return { ok: true };
}

/** One row: an object, and small enough to store. */
export function checkRow(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return { ok: false, reason: 'Every record must be an object.', code: 'bad-rows' };
  }
  let serialised = '';
  try {
    serialised = JSON.stringify(row);
  } catch {
    return { ok: false, reason: 'The record contains something that cannot be stored.', code: 'bad-rows' };
  }
  if (Buffer.byteLength(serialised, 'utf8') > MAX_ROW_BYTES) {
    return { ok: false, reason: 'A record can hold at most ' + Math.round(MAX_ROW_BYTES / 1000) + ' KB.', code: 'too-large' };
  }
  return { ok: true };
}

/**
 * The row to store for an incoming write.
 *
 * A create starts from what the caller sent (plus an id when there is none); an **update merges into the row that
 * is already there**, because a patch carries only what changed. Getting that backwards is silent data loss - an
 * invoice that loses its number while every request looks successful. `__proto__` and friends are dropped: they
 * are not data, and a JSON body from a browser is exactly where they arrive from.
 */
export function nextRowFor(resource, input, existing) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const row = existing ? { ...existing } : { id: '' };
  for (const [key, value] of Object.entries(input)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    if (key === 'id' && existing) continue;
    row[key] = value;
  }
  if (!row.id) row.id = resource + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  return row;
}

// --- the file driver ---------------------------------------------------------------------------------

function readFile(resource) {
  try {
    const parsed = JSON.parse(readFileSync(fileFor(resource), 'utf8'));
    return Array.isArray(parsed) ? parsed.filter((row) => row && typeof row === 'object' && !Array.isArray(row)) : [];
  } catch {
    return [];
  }
}

function writeFile(resource, rows) {
  const check = checkRows(rows);
  if (check.ok === false) return check;
  const file = fileFor(resource);
  mkdirSync(path.dirname(file), { recursive: true });
  // Written beside the real file and renamed: an interrupted write cannot leave half a collection behind, which
  // is the difference between "the last save was lost" and "the app has no data any more".
  const temporary = file + '.' + process.pid + '.tmp';
  writeFileSync(temporary, JSON.stringify(rows, null, 2), 'utf8');
  renameSync(temporary, file);
  return { ok: true, rows };
}

// --- the Postgres driver -----------------------------------------------------------------------------

let injectedClient = null;
let ownClientPromise = null;

/**
 * Hands the driver a client instead of letting it open one.
 *
 * A host that already has a pool, and a test that has an in-memory engine, both need this; nothing else does. The
 * client only has to offer `query(sql, params)`, which is the whole surface the driver uses.
 */
export function usePostgresClient(client) {
  injectedClient = client;
  return client;
}

async function db() {
  if (injectedClient) return injectedClient;
  if (!ownClientPromise) {
    ownClientPromise = (async () => {
      const pg = await import('pg').catch(() => {
        throw new Error(
          'DATABASE_URL is set but the "pg" package is not installed. Run "npm install pg" in this project.'
        );
      });
      const client = new pg.default.Client({ connectionString: process.env.DATABASE_URL });
      await client.connect();
      return client;
    })();
  }
  return ownClientPromise;
}

/**
 * Runs one statement, and turns "the table is not there" into the command that fixes it.
 *
 * The driver never creates the schema itself: the migrations are the only place that says what the tables are, and
 * a second copy here would be a second truth. So a database that has not been migrated gets a refusal naming
 * `npm run db:migrate` instead of an error nobody can act on. Exported because the accounts module runs its own
 * statements through exactly this guard.
 */
export async function query(sql, params) {
  const client = await db();
  try {
    return await client.query(sql, params);
  } catch (error) {
    if (error && error.code === '42P01') {
      throw Object.assign(
        new Error('The database has no tables yet. Run "npm run db:migrate" once, then try again.'),
        { code: 'no-schema' }
      );
    }
    throw error;
  }
}

// --- the API the routes call -------------------------------------------------------------------------

/**
 * Every row of a collection, oldest first.
 *
 * Two namespaces, deliberately disjoint: with an owner, only that owner's rows; without one, only the rows nobody
 * owns. A row written as someone's does not become visible to everyone because a screen forgot to ask for `mine` -
 * that is the leak this split exists to prevent.
 */
export async function list(resource, owner) {
  if (!isResourceName(resource)) throw Object.assign(new Error('A collection name is a short lowercase URL segment.'), { code: 'bad-resource' });
  if (storageKind() === 'file') {
    const rows = readFile(resource);
    return owner ? rows.filter((row) => row.ownerId === owner) : rows.filter((row) => !row.ownerId);
  }
  const result = owner
    ? await query('select data from app_rows where collection = $1 and owner_id = $2 order by created_at asc', [resource, owner])
    : await query('select data from app_rows where collection = $1 and owner_id is null order by created_at asc', [resource]);
  return result.rows.map((row) => row.data);
}

export async function get(resource, id, owner) {
  if (storageKind() === 'file') {
    const row = readFile(resource).find((entry) => entry.id === id) || null;
    if (!row) return null;
    return owner ? (row.ownerId === owner ? row : null) : row.ownerId ? null : row;
  }
  const result = owner
    ? await query('select data from app_rows where collection = $1 and id = $2 and owner_id = $3', [resource, id, owner])
    : await query('select data from app_rows where collection = $1 and id = $2 and owner_id is null', [resource, id]);
  return result.rows.length > 0 ? result.rows[0].data : null;
}

export async function create(resource, input, owner) {
  const row = nextRowFor(resource, input);
  if (!row) return { ok: false, reason: 'A record has to be an object.', code: 'bad-row' };
  // The owner is written into the record itself, so a row carries whose it is whichever driver holds it.
  if (owner) row.ownerId = owner;
  const single = checkRow(row);
  if (single.ok === false) return single;
  if (storageKind() === 'file') {
    const rows = readFile(resource);
    const stored = writeFile(resource, [...rows, row]);
    return stored.ok === false ? stored : { ok: true, row };
  }
  await query('insert into app_rows (id, collection, owner_id, data) values ($1, $2, $3, $4)', [
    row.id,
    resource,
    owner || null,
    JSON.stringify(row),
  ]);
  return { ok: true, row };
}

/** Merges in the database: `data || $patch`, so a concurrent writer keeps the fields it touched. */
export async function update(resource, id, patch, owner) {
  const merged = nextRowFor(resource, patch, { id });
  if (!merged) return { ok: false, reason: 'A record has to be an object.', code: 'bad-row' };
  if (storageKind() === 'file') {
    const rows = readFile(resource);
    const index = rows.findIndex((row) => row.id === id);
    const mine = index !== -1 && (owner ? rows[index].ownerId === owner : !rows[index].ownerId);
    if (!mine) return { ok: false, reason: resource + ' ' + id + ' does not exist.', code: 'not-found' };
    rows[index] = nextRowFor(resource, patch, rows[index]);
    if (owner) rows[index].ownerId = owner;
    const stored = writeFile(resource, rows);
    if (stored.ok === false) return stored;
    const single = checkRow(rows[index]);
    return single.ok === false ? single : { ok: true, row: rows[index] };
  }
  const clean = { ...patch };
  delete clean.id;
  delete clean.__proto__;
  const result = owner
    ? await query(
        'update app_rows set data = data || $4::jsonb, updated_at = now() where collection = $1 and id = $2 and owner_id = $3 returning data',
        [resource, id, owner, JSON.stringify(clean)]
      )
    : await query(
        'update app_rows set data = data || $3::jsonb, updated_at = now() where collection = $1 and id = $2 and owner_id is null returning data',
        [resource, id, JSON.stringify(clean)]
      );
  if (result.rows.length === 0) return { ok: false, reason: resource + ' ' + id + ' does not exist.', code: 'not-found' };
  return { ok: true, row: result.rows[0].data };
}

export async function remove(resource, id, owner) {
  if (storageKind() === 'file') {
    const rows = readFile(resource);
    const next = rows.filter((row) => !(row.id === id && (owner ? row.ownerId === owner : !row.ownerId)));
    if (next.length === rows.length) return { ok: false, reason: resource + ' ' + id + ' does not exist.', code: 'not-found' };
    const stored = writeFile(resource, next);
    return stored.ok === false ? stored : { ok: true };
  }
  const result = owner
    ? await query('delete from app_rows where collection = $1 and id = $2 and owner_id = $3', [resource, id, owner])
    : await query('delete from app_rows where collection = $1 and id = $2 and owner_id is null', [resource, id]);
  if (result.rowCount === 0) return { ok: false, reason: resource + ' ' + id + ' does not exist.', code: 'not-found' };
  return { ok: true };
}

/** Replaces a whole collection (one owner's rows when an owner is given). One transaction in the database. */
export async function replaceAll(resource, rows, owner) {
  const check = checkRows(rows);
  if (check.ok === false) return check;
  const stamped = owner ? rows.map((row) => ({ ...row, ownerId: owner })) : rows.map((row) => {
    const copy = { ...row };
    delete copy.ownerId;
    return copy;
  });
  if (storageKind() === 'file') {
    const kept = owner ? readFile(resource).filter((row) => row.ownerId !== owner) : readFile(resource).filter((row) => row.ownerId);
    return writeFile(resource, [...kept, ...stamped]);
  }
  await query('begin');
  try {
    if (owner) await query('delete from app_rows where collection = $1 and owner_id = $2', [resource, owner]);
    else await query('delete from app_rows where collection = $1 and owner_id is null', [resource]);
    for (const row of stamped) {
      await query('insert into app_rows (id, collection, owner_id, data) values ($1, $2, $3, $4)', [
        row.id,
        resource,
        owner || null,
        JSON.stringify(row),
      ]);
    }
    await query('commit');
  } catch (error) {
    await query('rollback').catch(() => undefined);
    return { ok: false, reason: 'The collection could not be replaced: ' + (error && error.message ? error.message : String(error)), code: 'store-refused' };
  }
  return { ok: true, rows: stamped };
}

/** The collections this app has, for `GET /api/health`. */
export async function listResources() {
  if (storageKind() === 'file') {
    try {
      return readdirSync(dataDir())
        .filter((name) => name.endsWith('.json') && !name.endsWith('.tmp'))
        .map((name) => name.slice(0, -'.json'.length))
        .filter(isResourceName);
    } catch {
      return [];
    }
  }
  const result = await query('select distinct collection from app_rows order by collection');
  return result.rows.map((row) => row.collection);
}
