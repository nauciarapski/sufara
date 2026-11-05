-- 0001_init.sql - the tables behind the project's own API.
--
-- Run it with `npm run db:migrate` (needs DATABASE_URL). Until a database is connected the API keeps its
-- collections in server/.data/, so this file changes nothing on its own.
--
-- Why a document column: the rows the app writes are objects (see src/lib/data.js). Storing them as jsonb keeps
-- the app exactly as it is while making the data real - one database, transactions, backups, and a place to add
-- constraints as they are discovered.
--
-- To make a collection typed, add your own migration; it lives beside this one and needs no change in the app
-- beyond the field names the code already uses:
--
--   create table if not exists invoices (
--     id text primary key,
--     client text not null,
--     total_cents integer not null check (total_cents >= 0),
--     issued_at timestamptz not null default now()
--   );

create table if not exists app_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists app_rows (
  id text primary key,
  collection text not null,
  -- Null until accounts exist: the row belongs to whoever the app says, and this is the column an RLS policy and
  -- a "only my rows" query will use the day auth is connected.
  owner_id text,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Every read the API makes is "one collection, newest first", and every write is one row by id.
create index if not exists app_rows_collection_idx on app_rows (collection, created_at desc);
create index if not exists app_rows_owner_idx on app_rows (owner_id) where owner_id is not null;
create index if not exists app_rows_data_idx on app_rows using gin (data jsonb_path_ops);
