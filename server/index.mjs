/**
 * The API behind Sufara.
 *
 * Platform-owned plumbing: the screens do not call this directly, they call `src/lib/data.js`, which is the only
 * module that knows where data lives. Vite proxies `/api` here in development; a container or any Node host runs
 * this file as-is (`npm start`), which is why it has no dependencies and reads its settings from the environment.
 *
 * This file is transport: it parses a request, calls the store (`server/store.mjs`), and turns the answer into a
 * status code. Where the rows actually live - a file or a Postgres database - is the store's decision alone.
 *
 * The app may add its own endpoints: every `server/routes/<name>.mjs` answers `/api/<name>/...` and is asked
 * before the routes below. That folder is the app's, the rest of this file is the platform's.
 */
import { createServer } from 'node:http';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import './env.mjs';
import {
  MAX_RESOURCE_BYTES,
  MAX_ROWS,
  create,
  get,
  isResourceName,
  list,
  listResources,
  query,
  remove,
  replaceAll,
  storageKind,
  update,
} from './store.mjs';
import {
  RESERVED_COLLECTIONS,
  attemptAllowed,
  clearCookie,
  cookieFlagsFor,
  currentUser,
  login,
  logout,
  sessionCookie,
  signup,
} from './auth.mjs';

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const BODY_LIMIT = 1000000;

function send(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  response.end(body);
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > BODY_LIMIT) {
      const error = new Error('The request body is larger than this server accepts (1 MB).');
      error.code = 'too-large';
      throw error;
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('The request body is not valid JSON.');
    error.code = 'bad-json';
    throw error;
  }
}

function refuse(response, status, reason, code) {
  send(response, status, { ok: false, reason, code });
}

/**
 * The store's codes that mean "the request was wrong", and the two that are not a 400.
 *
 * Anything else is a 500 with the reason in it: a bug in the app's own API must say so rather than look like a
 * user error, and a client that retries a 400 forever is the same bug seen from the other side.
 */
const CLIENT_ERRORS = new Set([
  'too-large',
  'too-many-rows',
  'bad-json',
  'bad-row',
  'bad-rows',
  'bad-resource',
  'no-id',
  'not-found',
]);

function statusForCode(code) {
  if (code === 'not-found') return 404;
  if (code === 'too-large') return 413;
  // The storage refused a write that the request was allowed to make: not the caller's fault, and not a 500 that
  // reads like a bug in the app either.
  if (code === 'store-refused') return 503;
  return CLIENT_ERRORS.has(code) ? 400 : 500;
}

/**
 * The app's own endpoints: every `server/routes/<name>.mjs` answers `/api/<name>/...`.
 *
 * This exists because an integration usually needs something only a server can hold - a client id and secret, a
 * token worth caching, a provider whose endpoint refuses a browser. The alternative is what a page does when it has
 * nowhere else to put a secret: it publishes it.
 *
 * A route module exports `handle({ request, response, url, segments, send, readJson, store, env })` and returns
 * `false` to let the routes below answer; anything else means it answered. `readJson()` reads the request body
 * once. A route that throws answers 500 with its own message and does not take the API with it.
 */
const ROUTES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'routes');
const ROUTE_NAME = /^[a-z][a-z0-9-]{0,31}$/;
const CUSTOM_ROUTES = new Map();

async function loadCustomRoutes() {
  let entries = [];
  try {
    entries = await readdir(ROUTES_DIR);
  } catch {
    return; // no folder is the normal case: an app with no integration has nothing to add
  }
  for (const entry of entries.sort()) {
    if (!entry.endsWith('.mjs')) continue;
    const name = entry.slice(0, -4);
    if (!ROUTE_NAME.test(name)) {
      console.error('[api] server/routes/' + entry + ' is not a route name (lowercase letters, digits, dashes)');
      continue;
    }
    try {
      const loaded = await import(pathToFileURL(path.join(ROUTES_DIR, entry)).href);
      const handle =
        typeof loaded.handle === 'function'
          ? loaded.handle
          : loaded.default && typeof loaded.default === 'function'
            ? loaded.default
            : null;
      if (!handle) {
        console.error('[api] server/routes/' + entry + ' exports no handle(), so /api/' + name + ' answers 404');
        continue;
      }
      CUSTOM_ROUTES.set(name, handle);
      console.log('[api] route loaded: /api/' + name + '/* -> server/routes/' + entry);
    } catch (error) {
      // A route that cannot load must not take the API with it: the screens and the collections still work.
      console.error('[api] server/routes/' + entry + ' could not be loaded: ' + (error && error.message ? error.message : error));
    }
  }
}

await loadCustomRoutes();

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://localhost');
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments[0] !== 'api') {
    return refuse(response, 404, 'This server answers /api/* only.', 'not-found');
  }
  try {
    if (segments[1] === 'health') {
      return send(response, 200, {
        ok: true,
        app: "Sufara",
        mode: 'server',
        storage: storageKind(),
        resources: await listResources(),
        accounts: true,
        limits: { rows: MAX_ROWS, bytes: MAX_RESOURCE_BYTES },
        routes: [...CUSTOM_ROUTES.keys()].sort(),
      });
    }

    // --- the app's own routes (server/routes/<name>.mjs) ---------------------------------------------
    const route = CUSTOM_ROUTES.get(segments[1] || '');
    if (route) {
      let answered;
      try {
        answered = await route({
          request,
          response,
          url,
          segments,
          send: (status, payload) => send(response, status, payload),
          readJson: () => readBody(request),
          store: { list, get, create, update, remove, replaceAll, listResources },
          env: process.env,
        });
      } catch (error) {
        const reason = error && error.message ? error.message : 'The route failed.';
        if (!response.headersSent) refuse(response, 500, reason, 'route-failed');
        return;
      }
      // Anything but an explicit false means the route answered, including a stream it ended itself.
      if (answered !== false) return;
    }

    // --- accounts ------------------------------------------------------------------------------------
    if (segments[1] === 'auth') {
      const action = segments[2] || '';
      const address = request.socket && request.socket.remoteAddress ? request.socket.remoteAddress : 'unknown';
      if (action === 'me') {
        return send(response, 200, { ok: true, user: await currentUser(query, request.headers.cookie) });
      }
      if (action === 'logout') {
        await logout(query, request.headers.cookie);
        response.setHeader('Set-Cookie', clearCookie() + cookieFlagsFor(request));
        return send(response, 200, { ok: true, user: null });
      }
      if (action === 'signup' || action === 'login') {
        if (!attemptAllowed(address + ':' + action)) {
          return refuse(response, 429, 'Too many attempts. Wait a minute and try again.', 'too-many-attempts');
        }
        const body = await readBody(request);
        const result =
          action === 'signup'
            ? await signup(query, body && body.email, body && body.password)
            : await login(query, body && body.email, body && body.password);
        if (result.ok === false) {
          // 401 for credentials, 409 for an email that is taken, 400 for anything wrong with what was sent.
          const status = result.code === 'bad-credentials' ? 401 : result.code === 'email-taken' ? 409 : 400;
          return refuse(response, status, result.reason, result.code);
        }
        response.setHeader('Set-Cookie', sessionCookie(result.session.id, result.session.maxAgeSeconds) + cookieFlagsFor(request));
        return send(response, action === 'signup' ? 201 : 200, { ok: true, user: result.user });
      }
      return refuse(response, 404, 'The account routes are signup, login, logout and me.', 'not-found');
    }

    // --- the signed-in person's own rows ------------------------------------------------------------
    const scoped = segments[1] === 'mine';
    const resource = scoped ? segments[2] || '' : segments[1] || '';
    const rowId = scoped ? segments[3] || '' : segments[2] || '';
    if (!isResourceName(resource)) {
      return refuse(response, 400, 'A collection name is a short lowercase URL segment, like "invoices".', 'bad-resource');
    }
    // Accounts are not a collection: the endpoint that serves app data can never serve a password hash.
    if (RESERVED_COLLECTIONS.includes(resource)) {
      return refuse(response, 400, '"' + resource + '" is reserved for accounts, so it is not a collection.', 'reserved-collection');
    }
    let owner = null;
    if (scoped) {
      const user = await currentUser(query, request.headers.cookie);
      if (!user) return refuse(response, 401, 'Sign in to see your own records.', 'sign-in-required');
      owner = user.id;
    }

    if (request.method === 'GET') {
      if (rowId) {
        const row = await get(resource, rowId, owner);
        if (!row) return refuse(response, 404, resource + ' ' + rowId + ' does not exist.', 'not-found');
        return send(response, 200, { ok: true, rows: [row], row });
      }
      return send(response, 200, { ok: true, rows: await list(resource, owner) });
    }

    if (request.method === 'POST') {
      const result = await create(resource, await readBody(request), owner);
      if (result.ok === false) return refuse(response, statusForCode(result.code), result.reason, result.code);
      return send(response, 201, { ok: true, row: result.row, rows: await list(resource, owner) });
    }

    if (request.method === 'PUT') {
      const body = await readBody(request);
      const next = Array.isArray(body) ? body : body && Array.isArray(body.rows) ? body.rows : null;
      if (!next) return refuse(response, 400, 'Send a list of records to replace a collection.', 'bad-rows');
      const result = await replaceAll(resource, next, owner);
      if (result.ok === false) return refuse(response, statusForCode(result.code), result.reason, result.code);
      return send(response, 200, { ok: true, rows: result.rows });
    }

    if (request.method === 'PATCH') {
      if (!rowId) return refuse(response, 400, 'An update needs the record id in the path.', 'no-id');
      const result = await update(resource, rowId, await readBody(request), owner);
      if (result.ok === false) return refuse(response, statusForCode(result.code), result.reason, result.code);
      return send(response, 200, { ok: true, row: result.row, rows: await list(resource, owner) });
    }

    if (request.method === 'DELETE') {
      if (!rowId) return refuse(response, 400, 'A delete needs the record id in the path.', 'no-id');
      const result = await remove(resource, rowId, owner);
      if (result.ok === false) return refuse(response, statusForCode(result.code), result.reason, result.code);
      return send(response, 200, { ok: true, rows: await list(resource, owner) });
    }

    return refuse(response, 405, request.method + ' is not a method this API answers.', 'bad-method');
  } catch (error) {
    const code = error && error.code ? error.code : 'request-failed';
    return refuse(response, statusForCode(code), error && error.message ? error.message : 'The request failed.', code);
  }
});

server.listen(PORT, HOST, () => {
  console.log(
    '[api] Sufara listens on http://localhost:' + PORT + ' (storage: ' + storageKind() + ')'
  );
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
