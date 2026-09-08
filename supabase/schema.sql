-- Clean Inventory database schema
-- Run this once in the Supabase SQL editor for your project
-- (Dashboard -> SQL Editor -> New query -> paste this whole file -> Run)

create extension if not exists "pgcrypto";

-- A physical location: a shelf, bin, room, drawer, etc. Each one gets a QR code.
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,        -- short code used in the QR code URL (/l/<code>)
  name text not null,               -- human friendly name, e.g. "Shelf A3" or "Van 2 - drawer 4"
  notes text,
  created_at timestamptz not null default now()
);

-- A kind of part/item that can live at one or more locations.
create table if not exists parts (
  id uuid primary key default gen_random_uuid(),
  sku text,
  name text not null,
  description text,
  photo_url text,
  created_at timestamptz not null default now()
);
create index if not exists parts_name_idx on parts using gin (to_tsvector('simple', name));
create index if not exists parts_sku_idx on parts (sku);

-- How much of a part is at a given location right now.
create table if not exists inventory (
  location_id uuid not null references locations(id) on delete cascade,
  part_id uuid not null references parts(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (location_id, part_id)
);

-- Every stock change, for a basic audit trail / history.
create table if not exists movements (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references locations(id) on delete set null,
  part_id uuid references parts(id) on delete set null,
  delta integer not null,          -- positive = added, negative = pulled
  reason text not null,            -- 'initial' | 'add' | 'pull' | 'adjust'
  note text,
  created_at timestamptz not null default now()
);
create index if not exists movements_part_idx on movements (part_id);
create index if not exists movements_location_idx on movements (location_id);
create index if not exists movements_created_idx on movements (created_at desc);

-- The app only ever talks to Supabase using the service role key from server-side
-- code (never the anon key from the browser), so we lock every table down with RLS
-- and add no policies -- the service role key bypasses RLS entirely.
alter table locations enable row level security;
alter table parts enable row level security;
alter table inventory enable row level security;
alter table movements enable row level security;

-- Applies one stock change (positive = add, negative = pull) and logs it, as
-- a single transaction so the inventory row and the movement log never drift
-- apart. Creates the inventory row (starting at 0) the first time a part is
-- placed at a location.
create or replace function apply_stock_change(
  p_location_id uuid,
  p_part_id uuid,
  p_delta integer,
  p_reason text,
  p_note text default null
) returns integer
language plpgsql
as $$
declare
  current_qty integer;
  new_qty integer;
begin
  insert into inventory (location_id, part_id, quantity)
  values (p_location_id, p_part_id, 0)
  on conflict (location_id, part_id) do nothing;

  select quantity into current_qty
    from inventory
    where location_id = p_location_id and part_id = p_part_id
    for update;

  new_qty := current_qty + p_delta;

  if new_qty < 0 then
    raise exception 'Not enough stock: only % on hand', current_qty
      using errcode = 'P0001';
  end if;

  update inventory
    set quantity = new_qty, updated_at = now()
    where location_id = p_location_id and part_id = p_part_id;

  insert into movements (location_id, part_id, delta, reason, note)
    values (p_location_id, p_part_id, p_delta, p_reason, p_note);

  return new_qty;
end;
$$;

-- After running this file, also create a public storage bucket named
-- "part-photos" (Storage -> New bucket -> name it exactly "part-photos" and mark
-- it Public) so part photos have a URL the app can display. If you want a
-- different bucket name, set SUPABASE_PHOTO_BUCKET to match in your env vars.
