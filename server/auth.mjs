/**
 * Accounts for this app: signup, login, logout, and the current user.
 *
 * Platform-owned plumbing. Screens call `auth.*` from `src/lib/data.js`; nothing here is a screen's business.
 * Passwords are hashed with scrypt and a per-user salt, sessions live in the store (file or Postgres) so a logout
 * revokes them, and the cookie is an opaque id plus an HMAC signature - never a user id anybody could edit.
 */
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const COOKIE_NAME = 'kood_session';
const SESSION_DAYS = 30;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_MIN = 8;

/** The collections the generic API refuses, so app data can never reach an account record. */
export const RESERVED_COLLECTIONS = ['users', 'user', 'auth', 'sessions', 'session', 'accounts'];

function dataDir() {
  return process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), 'server', '.data');
}

function authFile() {
  return path.join(dataDir(), '.auth.json');
}

function readAuthState() {
  try {
    const parsed = JSON.parse(readFileSync(authFile(), 'utf8'));
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    return { users: [], sessions: [] };
  }
}

function writeAuthState(state) {
  mkdirSync(dataDir(), { recursive: true });
  writeFileSync(authFile(), JSON.stringify(state, null, 2), 'utf8');
}

export function normaliseEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function isEmail(value) {
  const email = normaliseEmail(value);
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

/** scrypt with its own salt: the stored value says the scheme, so it can be replaced later without a migration. */
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(String(password), salt, 64).toString('hex');
  return 'scrypt$' + salt + '$' + hash;
}

export function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const expected = Buffer.from(parts[2], 'hex');
  const actual = scryptSync(String(password), parts[1], 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/**
 * All the password rules in one place, so signup, login and any future "change password" agree.
 * Deliberately few: a long minimum, no composition rules, and the same answer whatever is wrong with the email.
 */
export function passwordProblem(password) {
  const value = String(password || '');
  if (value.length < PASSWORD_MIN) return 'A password needs at least ' + PASSWORD_MIN + ' characters.';
  if (value.length > 200) return 'That password is too long.';
  return null;
}

/** The account shape that is safe to send: an id, an email, and when it was created. Never a hash. */
export function publicUser(user) {
  if (!user) return null;
  return { id: user.id, email: user.email, createdAt: user.createdAt || null };
}

let sessionSecretCache = null;

/**
 * The key that signs a session cookie.
 *
 * `SESSION_SECRET` when a host sets one; otherwise a random secret generated once and kept beside the data, so
 * sessions survive a restart on a single machine. Two instances without the shared variable would each sign with
 * their own - which is exactly why the variable exists and why the health answer says whether it is set.
 */
export function sessionSecret() {
  if (sessionSecretCache) return sessionSecretCache;
  const configured = String(process.env.SESSION_SECRET || '').trim();
  if (configured) {
    sessionSecretCache = configured;
    return sessionSecretCache;
  }
  const secretFile = path.join(dataDir(), '.session-secret');
  try {
    const existing = readFileSync(secretFile, 'utf8').trim();
    if (existing) {
      sessionSecretCache = existing;
      return sessionSecretCache;
    }
  } catch {
    // not created yet
  }
  const generated = randomBytes(32).toString('hex');
  mkdirSync(dataDir(), { recursive: true });
  writeFileSync(secretFile, generated, 'utf8');
  sessionSecretCache = generated;
  return generated;
}

export function signSessionId(sessionId) {
  return createHmac('sha256', sessionSecret()).update(sessionId).digest('hex');
}

export function cookieValue(sessionId) {
  return sessionId + '.' + signSessionId(sessionId);
}

export function sessionIdFromCookie(header) {
  const raw = String(header || '');
  const match = raw.match(new RegExp('(?:^|;\\s*)' + COOKIE_NAME + '=([^;]+)'));
  if (!match) return null;
  const value = decodeURIComponent(match[1]);
  const dot = value.lastIndexOf('.');
  if (dot <= 0) return null;
  const sessionId = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  const expected = signSessionId(sessionId);
  if (signature.length !== expected.length) return null;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) ? sessionId : null;
}

export function sessionCookie(sessionId, maxAgeSeconds) {
  const secure = process.env.KOOD_INSECURE_COOKIES === '1' ? '' : '';
  return (
    COOKIE_NAME +
    '=' +
    encodeURIComponent(cookieValue(sessionId)) +
    '; HttpOnly; SameSite=Lax; Path=/' +
    secure +
    (maxAgeSeconds ? '; Max-Age=' + maxAgeSeconds : '')
  );
}

export function clearCookie() {
  return COOKIE_NAME + '=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0';
}

function newId(prefix) {
  return prefix + '-' + randomBytes(12).toString('hex');
}

/** One run of a query, whichever driver is configured. */
function authQueries(query) {
  return {
    async users() {
      if (process.env.DATABASE_URL) {
        const result = await query('select id, email, password_hash as "passwordHash", created_at as "createdAt" from app_users order by created_at asc');
        return result.rows.map((row) => ({ ...row, createdAt: String(row.createdAt) }));
      }
      return readAuthState().users;
    },
    async insertUser(user) {
      if (process.env.DATABASE_URL) {
        await query('insert into app_users (id, email, password_hash, created_at) values ($1, $2, $3, now())', [user.id, user.email, user.passwordHash]);
        return;
      }
      const state = readAuthState();
      state.users.push(user);
      writeAuthState(state);
    },
    async insertSession(session) {
      if (process.env.DATABASE_URL) {
        await query('insert into app_sessions (id, user_id, expires_at) values ($1, $2, $3)', [session.id, session.userId, session.expiresAt]);
        return;
      }
      const state = readAuthState();
      state.sessions.push(session);
      writeAuthState(state);
    },
    async sessions() {
      if (process.env.DATABASE_URL) {
        const result = await query('select id, user_id as "userId", expires_at as "expiresAt" from app_sessions');
        return result.rows.map((row) => ({ ...row, expiresAt: String(row.expiresAt) }));
      }
      return readAuthState().sessions;
    },
    async deleteSession(sessionId) {
      if (process.env.DATABASE_URL) {
        await query('delete from app_sessions where id = $1', [sessionId]);
        return;
      }
      const state = readAuthState();
      state.sessions = state.sessions.filter((session) => session.id !== sessionId);
      writeAuthState(state);
    },
  };
}

/** Creates an account, or says why it will not. The email is compared case-insensitively and its own way. */
export async function signup(query, email, password) {
  const clean = normaliseEmail(email);
  if (!isEmail(clean)) return { ok: false, reason: 'That does not look like an email address.', code: 'bad-email' };
  const problem = passwordProblem(password);
  if (problem) return { ok: false, reason: problem, code: 'bad-password' };
  const store = authQueries(query);
  const users = await store.users();
  if (users.some((user) => normaliseEmail(user.email) === clean)) {
    return { ok: false, reason: 'An account with that email already exists. Sign in instead.', code: 'email-taken' };
  }
  const user = { id: newId('user'), email: clean, passwordHash: hashPassword(password), createdAt: new Date().toISOString() };
  await store.insertUser(user);
  return { ok: true, user: publicUser(user), session: await startSession(store, user.id) };
}

/** Checks a password and starts a session. The same answer for an unknown email and a wrong password. */
export async function login(query, email, password) {
  const clean = normaliseEmail(email);
  const store = authQueries(query);
  const users = await store.users();
  const user = users.find((entry) => normaliseEmail(entry.email) === clean);
  const wrong = { ok: false, reason: 'That email and password do not match an account here.', code: 'bad-credentials' };
  if (!user) return wrong;
  if (!verifyPassword(password, user.passwordHash)) return wrong;
  return { ok: true, user: publicUser(user), session: await startSession(store, user.id) };
}

async function startSession(store, userId) {
  const session = {
    id: newId('sid'),
    userId,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  };
  await store.insertSession(session);
  return { id: session.id, maxAgeSeconds: SESSION_DAYS * 24 * 60 * 60 };
}

/** The signed-in user for a request, or null. An expired session is deleted on sight. */
export async function currentUser(query, cookieHeader) {
  const sessionId = sessionIdFromCookie(cookieHeader);
  if (!sessionId) return null;
  const store = authQueries(query);
  const sessions = await store.sessions();
  const session = sessions.find((entry) => entry.id === sessionId);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await store.deleteSession(sessionId);
    return null;
  }
  const users = await store.users();
  const user = users.find((entry) => entry.id === session.userId);
  return publicUser(user);
}

export async function logout(query, cookieHeader) {
  const sessionId = sessionIdFromCookie(cookieHeader);
  if (!sessionId) return false;
  await authQueries(query).deleteSession(sessionId);
  return true;
}

/**
 * A login attempt limit, in this process.
 *
 * Honest about what it is: per instance and in memory, which stops a script from guessing passwords in a loop and
 * does nothing about a distributed one. A host that needs more puts its own limiter in front of the API.
 */
const attempts = new Map();

export function attemptAllowed(key, limit = 20, windowMs = 60000) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

/** Whether session cookies have to be marked Secure: they do when the request arrived over TLS. */
export function cookieFlagsFor(request) {
  const forwarded = String(request.headers['x-forwarded-proto'] || '').toLowerCase();
  const secure = forwarded === 'https' || Boolean(request.socket && request.socket.encrypted);
  return secure ? '; Secure' : '';
}
