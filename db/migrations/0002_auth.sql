-- 0002_auth.sql - the tables behind signup, login and sessions.
--
-- Run with `npm run db:migrate`. Accounts live in their own tables, never in `app_rows`, so the endpoint that
-- serves an app's collections can never serve a password hash: the API also refuses those names as collections.

create table if not exists app_users (
  id text primary key,
  email text not null unique,
  -- "scrypt$<salt>$<hash>": the scheme travels with the value, so it can be replaced without a migration.
  password_hash text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists app_users_email_idx on app_users (lower(email));

create table if not exists app_sessions (
  id text primary key,
  user_id text not null references app_users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists app_sessions_user_idx on app_sessions (user_id);

-- Rows the app writes as a signed-in person carry the owner, and every `/api/mine/*` query filters on it. Row-level
-- security is the upgrade that moves that rule into the database itself; until then it is enforced in one place
-- (the driver) and asserted by the project's own test. The column is here now so that move needs no data change.
