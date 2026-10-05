-- Clean Inventory — Supabase schema
-- Run this once in your project's SQL Editor (Supabase dashboard → SQL Editor → New query → paste → Run).
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS throughout.

create extension if not exists pgcrypto;

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  section text,
  aisle text,
  bay text,
  shelf text,
  notes text,
  created_at bigint,
  recent_activity jsonb not null default '[]'::jsonb
);

-- Migration for a locations table created before section/aisle/bay/shelf existed —
-- harmless no-ops if the columns are already there.
alter table locations add column if not exists section text;
alter table locations add column if not exists aisle text;
alter table locations add column if not exists bay text;
alter table locations add column if not exists shelf text;

create table if not exists parts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text,
  description text,
  photo_data_url text,
  created_at bigint,
  recent_activity jsonb not null default '[]'::jsonb
);

create table if not exists inventory (
  id text primary key,
  location_id uuid references locations(id) on delete cascade,
  part_id uuid references parts(id) on delete cascade,
  quantity integer not null default 0,
  updated_at bigint
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  address text,
  -- open | backordered | picked | packed | staging | closed | cancelled
  status text not null default 'open',
  -- [{ "partId": "<parts.id>", "quantity": 3 }, ...]
  lines jsonb not null default '[]'::jsonb,
  -- for a backorder (<order_number>.<n>), the order_number it was split from
  parent_order text,
  -- how it's going out, set at the end of packing: { "box": 2, "bag": 1, "other": 0 }
  packages jsonb,
  -- where a Staging order is waiting for pickup, e.g. ST-04
  staging_location text,
  created_at bigint,
  updated_at bigint
);

-- Migration for an orders table created before backorders existed.
alter table orders add column if not exists parent_order text;
alter table orders add column if not exists staging_location text;
alter table orders add column if not exists packages jsonb;

alter table locations enable row level security;
alter table parts enable row level security;
alter table inventory enable row level security;
alter table orders enable row level security;

-- The app's only access control is a client-side passcode gate (not real auth), so these
-- policies allow the anon/public key full read+write. Anyone with the project URL + anon key
-- can bypass the passcode and hit the database directly — acceptable for a low-stakes
-- internal tool, but don't put sensitive data in it.

drop policy if exists "public select locations" on locations;
create policy "public select locations" on locations for select using (true);
drop policy if exists "public insert locations" on locations;
create policy "public insert locations" on locations for insert with check (true);
drop policy if exists "public update locations" on locations;
create policy "public update locations" on locations for update using (true) with check (true);
drop policy if exists "public delete locations" on locations;
create policy "public delete locations" on locations for delete using (true);

drop policy if exists "public select parts" on parts;
create policy "public select parts" on parts for select using (true);
drop policy if exists "public insert parts" on parts;
create policy "public insert parts" on parts for insert with check (true);
drop policy if exists "public update parts" on parts;
create policy "public update parts" on parts for update using (true) with check (true);
drop policy if exists "public delete parts" on parts;
create policy "public delete parts" on parts for delete using (true);

drop policy if exists "public select inventory" on inventory;
create policy "public select inventory" on inventory for select using (true);
drop policy if exists "public insert inventory" on inventory;
create policy "public insert inventory" on inventory for insert with check (true);
drop policy if exists "public update inventory" on inventory;
create policy "public update inventory" on inventory for update using (true) with check (true);
drop policy if exists "public delete inventory" on inventory;
create policy "public delete inventory" on inventory for delete using (true);

drop policy if exists "public select orders" on orders;
create policy "public select orders" on orders for select using (true);
drop policy if exists "public insert orders" on orders;
create policy "public insert orders" on orders for insert with check (true);
drop policy if exists "public update orders" on orders;
create policy "public update orders" on orders for update using (true) with check (true);
drop policy if exists "public delete orders" on orders;
create policy "public delete orders" on orders for delete using (true);

-- Enable realtime (live sync between devices). Skips tables that are already members, so this
-- script is safe to re-run.
do $$
declare t text;
begin
  foreach t in array array['locations', 'parts', 'inventory', 'orders'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
