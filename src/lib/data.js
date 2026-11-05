/**
 * The only place that touches storage.
 *
 * Sufara reads and writes through this module instead of calling localStorage or fetch directly, so
 * the day a real backend is connected, only this file changes - screens keep calling exactly the
 * functions below. The API is deliberately asynchronous and resource-shaped, because that is the
 * shape a network call has: nothing outside needs to know where the data actually lives.
 *
 * Where the rows live is decided at runtime and not by the screens: with the project's own server running
 * (`npm run dev`, a container, your own host) they are that server's collections, so they survive a reload and
 * travel with the code; in a published app the same calls go to Sufara's storage on the platform; with neither
 * they stay in this browser so a static preview still works. Plain `db.*` calls are shared by everyone who opens
 * the app. Accounts (`auth.*` and `mine.*`) are answered by the app's own server and by the platform, with the
 * same routes and the same rules, so a screen that signs people in works in all of them; only a page with neither
 * says there is nowhere to sign in. See INTEGRATIONS.md for what to connect, which environment variable each one
 * needs, and what changes.
 */

const PREFIX = "kood:data:sufara:";
const subscribers = new Map();

/** The platform's own data endpoint, injected into a published page. Absent in the preview. */
const REMOTE =
  typeof window !== "undefined" && window.KOOD_DATA && window.KOOD_DATA.url ? window.KOOD_DATA : null;

/**
 * The app's own API - `server/index.mjs`, proxied by Vite under `/api`.
 *
 * This is the API **root**: `"/api"` on this origin (the default), or an absolute one when a host serves the page
 * from another address (`VITE_API_BASE` at build time, or `window.KOOD_API_BASE` injected into the page - the
 * same shape the platform uses for its own endpoint).
 */
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof window !== "undefined" && window.KOOD_API_BASE) ||
  "/api";

export const endpoints = [];

let activeMode = REMOTE ? "platform" : null;
let detection = null;

/**
 * Where the data is being kept. **Asked, never guessed.**
 *
 * Three answers, and a screen can honestly say which one it got:
 * - `platform` - the page is published on Kood and carries its own data endpoint and token;
 * - `server`   - the project's own API answered (`npm run dev`, a container, any Node host);
 * - `browser`  - neither did, so the rows live in this browser (`localStorage`).
 *
 * The probe needs the API to introduce itself (`mode: "server"`) rather than merely answer, because a static host
 * serving this app answers many paths with the app's own page - and a page is not an API.
 */
export async function storageMode() {
  if (REMOTE) return "platform";
  if (activeMode) return activeMode;
  if (!detection) {
    detection = (async () => {
      try {
        const controller = typeof AbortController === "function" ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), 1500) : null;
        const response = await fetch(API_BASE + "/health", controller ? { signal: controller.signal } : undefined);
        if (timer) clearTimeout(timer);
        const payload = response.ok ? await response.json().catch(() => null) : null;
        activeMode = payload && payload.mode === "server" ? "server" : "browser";
      } catch {
        activeMode = "browser";
      }
      return activeMode;
    })();
  }
  return detection;
}

function keyFor(resource) {
  return PREFIX + resource;
}

function urlFor(mode, resource, rowId) {
  const base = (mode === "platform" ? REMOTE.url : API_BASE) + "/" + resource;
  return rowId ? base + "/" + encodeURIComponent(rowId) : base;
}

async function request(mode, method, resource, rowId, body, baseOverride) {
  const headers = { "Content-Type": "application/json" };
  // A published page reaches the platform's endpoint, so the app's own token travels with the request. The
  // project's own API needs no token: the session is an HttpOnly cookie the browser sends on its own.
  if (mode === "platform") headers["x-kood-data-token"] = REMOTE.token;
  const url = baseOverride
    ? baseOverride + "/" + resource + (rowId ? "/" + encodeURIComponent(rowId) : "")
    : urlFor(mode, resource, rowId);
  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || payload.ok === false) {
    const error = new Error((payload && payload.reason) || "The app's data service answered " + response.status + ".");
    error.code = (payload && payload.code) || "data-unavailable";
    throw error;
  }
  return payload;
}

function read(resource) {
  try {
    const raw = localStorage.getItem(keyFor(resource));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(resource, rows) {
  const next = Array.isArray(rows) ? rows : [];
  localStorage.setItem(keyFor(resource), JSON.stringify(next));
  notify(resource);
  return next;
}

function notify(resource) {
  const listeners = subscribers.get(resource);
  if (!listeners) return;
  for (const listener of listeners) listener(read(resource));
}

function id(prefix) {
  return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

/** Seeds a resource once, so a first run shows real content instead of an empty screen. */
export async function seed(resource, rows) {
  if ((await storageMode()) !== "browser") {
    const existing = await db.list(resource);
    if (existing.length > 0) return existing;
    return db.replaceAll(resource, rows);
  }
  if (localStorage.getItem(keyFor(resource)) === null) write(resource, rows);
  return read(resource);
}

/**
 * Where the accounts live: the app's own server, or the platform when the app is published on it.
 *
 * Both answer the **same** contract (`auth/*`, `mine/*`), which is what lets one generated module work in the
 * preview, in the exported ZIP and in a published app. Only a page with neither has no accounts, and that case says
 * so instead of showing a screen with an empty list behind it.
 */
async function accountsMode(what) {
  const mode = await storageMode();
  if (mode === "browser") {
    const error = new Error(
      what +
        " needs the app's own server. It runs in the published app (we answer the same routes), with npm run dev, and on whatever host you deploy to - but not inside Kood's preview frame, which shows the screens only. Publish the app (or run it with npm run dev) and this works."
    );
    error.code = "no-accounts";
    throw error;
  }
  return mode;
}

/**
 * Accounts, when the app has them: the session lives in an HttpOnly cookie, so nothing here stores a token.
 *
 * Every call goes through `request`, the one helper that talks to the server, so the refusal a screen shows is
 * the server's own reason whether it came from a row or from a credential.
 */
export const auth = {
  /** The signed-in person, or null. Safe to call on every screen. */
  async me() {
    try {
      const mode = await accountsMode("Signing in");
      return (await request(mode, "GET", "auth/me", null, undefined)).user || null;
    } catch {
      // No API is not an error for a screen asking who is here: the answer is "nobody".
      return null;
    }
  },

  async signup(email, password) {
    const mode = await accountsMode("Signing up");
    return (await request(mode, "POST", "auth/signup", null, { email, password })).user;
  },

  async login(email, password) {
    const mode = await accountsMode("Signing in");
    return (await request(mode, "POST", "auth/login", null, { email, password })).user;
  },

  async logout() {
    const mode = await accountsMode("Signing out");
    await request(mode, "POST", "auth/logout", null, undefined);
    return null;
  },

  /**
   * The app's people, for the screens that manage them.
   *
   * Only the owner or an admin may read this list or change it: the server refuses anybody else with
   * `code: "not-allowed"`, so hiding the button is a convenience and never the check.
   */
  async users() {
    const mode = await accountsMode("The app's accounts");
    const answer = await request(mode, "GET", "auth/users", null, undefined);
    return { users: answer.users || [], roles: answer.roles || [], limit: answer.limit || 0 };
  },

  /** The owner or an admin adds somebody, with a first password they hand over in person. */
  async addUser(email, password, role) {
    const mode = await accountsMode("The app's accounts");
    return (await request(mode, "POST", "auth/users", null, { email, password, role })).user;
  },

  async setRole(email, role) {
    const mode = await accountsMode("The app's accounts");
    return (await request(mode, "POST", "auth/role", null, { email, role })).user;
  },

  async removeUser(email) {
    const mode = await accountsMode("The app's accounts");
    await request(mode, "DELETE", "auth/users", email, undefined);
    return true;
  },
};

/**
 * The signed-in person's own rows: `mine.list("invoices")` returns only theirs, and everything they create
 * belongs to them. The server enforces it (both the app's own server and the platform refuse a request with no
 * session, and both scope the rows by the signed-in user), so a screen cannot forget to filter.
 */
export const mine = {
  async list(resource) {
    const mode = await accountsMode("Your own records");
    return (await request(mode, "GET", "mine/" + resource, null, undefined)).rows;
  },
  async create(resource, row) {
    const mode = await accountsMode("Your own records");
    return (await request(mode, "POST", "mine/" + resource, null, row)).row;
  },
  async update(resource, rowId, patch) {
    const mode = await accountsMode("Your own records");
    return (await request(mode, "PATCH", "mine/" + resource, rowId, patch)).row;
  },
  async remove(resource, rowId) {
    const mode = await accountsMode("Your own records");
    await request(mode, "DELETE", "mine/" + resource, rowId, undefined);
    return true;
  },
};

export const db = {
  /** Every row of a resource. */
  async list(resource) {
    const mode = await storageMode();
    if (mode !== "browser") return (await request(mode, "GET", resource)).rows;
    return read(resource);
  },

  async get(resource, rowId) {
    const mode = await storageMode();
    if (mode !== "browser") {
      const rows = (await request(mode, "GET", resource)).rows;
      return rows.find((row) => row.id === rowId) || null;
    }
    return read(resource).find((row) => row.id === rowId) || null;
  },

  async create(resource, row) {
    const mode = await storageMode();
    if (mode !== "browser") {
      const created = (await request(mode, "POST", resource, null, row)).row;
      notify(resource);
      return created;
    }
    const created = { ...row, id: row.id || id(resource) };
    write(resource, [...read(resource), created]);
    return created;
  },

  async update(resource, rowId, patch) {
    const mode = await storageMode();
    if (mode !== "browser") {
      const updated = (await request(mode, "PATCH", resource, rowId, patch)).row;
      notify(resource);
      return updated;
    }
    const rows = read(resource);
    const index = rows.findIndex((row) => row.id === rowId);
    if (index === -1) throw new Error(resource + " " + rowId + " does not exist");
    const updated = { ...rows[index], ...patch, id: rowId };
    rows[index] = updated;
    write(resource, rows);
    return updated;
  },

  async remove(resource, rowId) {
    const mode = await storageMode();
    if (mode !== "browser") {
      await request(mode, "DELETE", resource, rowId);
      notify(resource);
      return true;
    }
    const rows = read(resource);
    const next = rows.filter((row) => row.id !== rowId);
    if (next.length === rows.length) throw new Error(resource + " " + rowId + " does not exist");
    write(resource, next);
    return true;
  },

  /** Replaces a whole resource - used by import and by "reset to sample data". */
  async replaceAll(resource, rows) {
    const mode = await storageMode();
    if (mode !== "browser") {
      const stored = (await request(mode, "PUT", resource, null, rows)).rows;
      notify(resource);
      return stored;
    }
    return write(resource, rows);
  },

  /** Re-renders a screen when the data changes *in this tab*. Another visitor's write is not announced. */
  subscribe(resource, listener) {
    const listeners = subscribers.get(resource) || new Set();
    listeners.add(listener);
    subscribers.set(resource, listeners);
    return () => listeners.delete(listener);
  },

  /**
   * Where the data is, so a screen can say it honestly - `platform`, `server`, `browser`, or `checking` for the
   * moment before the first answer arrives.
   */
  get durability() {
    return activeMode || (REMOTE ? "platform" : "checking");
  },
};

/**
 * Notifications for the people who run this app: a new application, a question, an order to prepare.
 *
 * They are rows in the app's own `notifications` collection, which is the whole design: they live wherever the
 * app's data lives (so they survive a reload and a restart), and every staff account of the app reads the same
 * list instead of each browser keeping its own. Something a *visitor* sees ("we received your request") is a
 * screen, not a notification.
 *
 * Nothing is emailed from here on purpose: an email needs a provider key, a key in a page is a key every visitor
 * can read, and delivery is the server's job (see INTEGRATIONS.md).
 */
export const notifications = {
  /** Something happened that a person in this app has to see. The recipient is a role or an account, never a hardcoded address. */
  async send(entry = {}) {
    return db.create("notifications", {
      kind: entry.kind || "info",
      subject: String(entry.subject || "").slice(0, 200),
      body: String(entry.body || "").slice(0, 2000),
      to: entry.to || "staff",
      link: entry.link || null,
      read: false,
      createdAt: new Date().toISOString(),
    });
  },

  /** Newest first, because a notification list is read from the top. */
  async list(options = {}) {
    const rows = await db.list("notifications");
    const sorted = rows
      .slice()
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return options.unreadOnly ? sorted.filter((row) => !row.read) : sorted;
  },

  async unread() {
    return (await notifications.list({ unreadOnly: true })).length;
  },

  async markRead(rowId) {
    return db.update("notifications", rowId, { read: true });
  },

  async markAllRead() {
    const rows = await notifications.list({ unreadOnly: true });
    for (const row of rows) await notifications.markRead(row.id);
    return rows.length;
  },

  async remove(rowId) {
    return db.remove("notifications", rowId);
  },

  subscribe(listener) {
    return db.subscribe("notifications", listener);
  },
};

export default db;
