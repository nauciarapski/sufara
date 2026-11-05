// The store behind the API, tested without starting a server.
//
// Platform-owned example: it uses a temporary directory, so it passes anywhere Node runs, and it asserts the
// rules the app depends on - an update merges instead of replacing, the limits hold, and a bad collection name
// is refused rather than written. The same functions are what a Postgres driver has to keep true.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = mkdtempSync(path.join(os.tmpdir(), 'app-data-'));
process.env.DATA_DIR = root;
delete process.env.DATABASE_URL;
const { checkRows, create, get, isResourceName, list, nextRowFor, remove, replaceAll, storageKind, update } =
  await import('../server/store.mjs');

test('with no database the rows live in files', () => {
  assert.equal(storageKind(), 'file');
});

test('a collection name is a short lowercase segment', () => {
  assert.equal(isResourceName('invoices'), true);
  assert.equal(isResourceName('../etc/passwd'), false);
  assert.equal(isResourceName('Invoices'), false);
});

test('a new row gets an id and an update merges into the row that is there', async () => {
  const created = await create('invoices', { number: 'INV-1', client: 'Ana' });
  assert.equal(created.ok, true);
  assert.equal(typeof created.row.id, 'string');
  const updated = await update('invoices', created.row.id, { client: 'Ana Beauty' });
  assert.equal(updated.row.number, 'INV-1', 'the patch must not drop a field it did not mention');
  assert.equal(updated.row.client, 'Ana Beauty');
  assert.equal(updated.row.id, created.row.id);
});

test('a row cannot smuggle a prototype key', () => {
  const row = nextRowFor('invoices', JSON.parse('{"__proto__": {"polluted": true}, "number": "INV-2"}'));
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal(row.number, 'INV-2');
});

test('the limits are refusals with a reason, not silent truncation', () => {
  assert.equal(checkRows(new Array(501).fill({ id: 'x' })).code, 'too-many-rows');
  assert.equal(checkRows([{ id: 'x', big: 'y'.repeat(200001) }]).code, 'too-large');
  assert.equal(checkRows('not a list').code, 'bad-rows');
});

test('what is written can be read back, and removed', async () => {
  assert.equal((await replaceAll('invoices', [{ id: 'a', number: 'INV-3' }])).ok, true);
  assert.equal((await list('invoices'))[0].number, 'INV-3');
  assert.equal((await get('invoices', 'a')).number, 'INV-3');
  assert.equal((await remove('invoices', 'a')).ok, true);
  assert.equal((await list('invoices')).length, 0);
  assert.equal((await remove('invoices', 'a')).code, 'not-found');
  rmSync(root, { recursive: true, force: true });
});
