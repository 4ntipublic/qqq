-- ============================================================================
-- akpkyy · Admin panel · PostgreSQL schema (Supabase)
-- ============================================================================
-- Apply via `supabase db push` or paste into the Supabase SQL editor.
-- Phase 4 migrates the admin panel from seed data to these tables.
-- ============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- Enums ----------------------------------------------------------------------
do $$ begin
  create type beat_status as enum ('draft', 'scheduled', 'published');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sale_status as enum ('Pagada', 'Pendiente', 'Cancelada', 'Devolucion');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('stripe', 'paypal', 'crypto', 'transfer');
exception when duplicate_object then null; end $$;

-- Categories -----------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

create index if not exists categories_slug_idx on public.categories (slug);

-- Beats ----------------------------------------------------------------------
create table if not exists public.beats (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  bpm          integer not null check (bpm between 50 and 250),
  category_id  uuid references public.categories(id) on delete set null,
  tone         text,
  release_at   timestamptz,
  status       beat_status not null default 'draft',
  audio_url    text,
  cover_url    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists beats_category_idx on public.beats (category_id);
create index if not exists beats_status_idx on public.beats (status);
create index if not exists beats_release_idx on public.beats (release_at);

-- Maintain updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists beats_set_updated_at on public.beats;
create trigger beats_set_updated_at
before update on public.beats
for each row execute function public.set_updated_at();

-- Sales ----------------------------------------------------------------------
create table if not exists public.sales (
  id              uuid primary key default uuid_generate_v4(),
  invoice_id      text not null unique,
  beat_id         uuid references public.beats(id) on delete set null,
  status          sale_status not null default 'Pendiente',
  payment_method  payment_method not null,
  amount_cents    integer not null check (amount_cents >= 0),
  currency        text not null default 'USD',
  buyer_email     text not null,
  created_at      timestamptz not null default now()
);

create index if not exists sales_status_idx on public.sales (status);
create index if not exists sales_created_idx on public.sales (created_at desc);

-- Storage bucket (for uploaded audio + cover art) ---------------------------
-- Run once in the Supabase dashboard if not already created:
--   insert into storage.buckets (id, name, public) values ('beats', 'beats', false);

-- Row-Level Security ---------------------------------------------------------
alter table public.categories enable row level security;
alter table public.beats enable row level security;
alter table public.sales enable row level security;

-- Public read on categories and published beats
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
  for select using (true);

drop policy if exists "beats_public_read_published" on public.beats;
create policy "beats_public_read_published" on public.beats
  for select using (status = 'published');

-- Admin write access is granted via the service role key on the server;
-- no anonymous write policies are declared on purpose.

-- ============================================================================
-- Seed (optional) ------------------------------------------------------------
-- insert into public.categories (name, slug) values
--   ('Trap', 'trap'),
--   ('Jerk', 'jerk'),
--   ('Ambient', 'ambient'),
--   ('Drill', 'drill')
-- on conflict (slug) do nothing;
