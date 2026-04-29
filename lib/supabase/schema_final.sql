-- ============================================================================
-- akpkyy · Master schema (FASE 12 · pre-deploy snapshot)
-- ----------------------------------------------------------------------------
-- Single-shot SQL that recreates the entire Supabase database from scratch.
-- Idempotent: safe to run multiple times; existing objects are preserved.
-- Paste in: Supabase Dashboard → SQL Editor → Run.
-- ============================================================================


-- ============================================================================
-- 0) EXTENSIONS
-- ============================================================================

create extension if not exists "uuid-ossp";


-- ============================================================================
-- 1) ENUM TYPES
-- ============================================================================
-- DO blocks make the type creation idempotent (CREATE TYPE has no IF NOT EXISTS).

do $$ begin
  create type beat_status as enum ('draft', 'scheduled', 'published');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sale_status as enum ('Pagada', 'Pendiente', 'Cancelada', 'Devolucion');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('stripe', 'paypal', 'crypto', 'transfer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type featured_format as enum ('grid', 'list');
exception when duplicate_object then null; end $$;


-- ============================================================================
-- 2) SHARED FUNCTIONS
-- ============================================================================

-- 2.1 · updated_at maintainer (used by every table with an updated_at column).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2.2 · Admin check that reads the JWT app_metadata claim. SECURITY DEFINER so
--       it can be called from RLS policies without recursion.
create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'is_admin')::boolean,
    false
  );
$$;


-- ============================================================================
-- 3) TABLES
-- ============================================================================

-- 3.1 · CATEGORIES -----------------------------------------------------------

create table if not exists public.categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

create index if not exists categories_slug_idx on public.categories (slug);


-- 3.2 · BEATS ----------------------------------------------------------------

create table if not exists public.beats (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  bpm          integer not null check (bpm between 50 and 250),
  category_id  uuid references public.categories(id) on delete set null,
  -- Asset URLs (R2 public proxy or direct CDN)
  audio_url       text,
  video_url       text,
  cover_url       text,
  contract_url    text,
  -- Metadata
  key             text,
  size_mb         numeric(10,2),
  release_date    timestamptz,
  is_visible      boolean not null default false,
  -- Featured carousel
  is_featured     boolean not null default false,
  featured_format featured_format not null default 'grid',
  featured_order  integer,
  -- Audit
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Forward-compatibility: re-add columns that may be missing on older databases
-- created from prior phases. ADD COLUMN IF NOT EXISTS is idempotent.
alter table public.beats add column if not exists key             text;
alter table public.beats add column if not exists video_url       text;
alter table public.beats add column if not exists contract_url    text;
alter table public.beats add column if not exists size_mb         numeric(10,2);
alter table public.beats add column if not exists is_visible      boolean not null default false;
alter table public.beats add column if not exists is_featured     boolean not null default false;
alter table public.beats add column if not exists featured_format featured_format not null default 'grid';
alter table public.beats add column if not exists featured_order  integer;
alter table public.beats add column if not exists release_date    timestamptz;

create index if not exists beats_category_idx on public.beats (category_id);
create index if not exists beats_release_idx  on public.beats (release_date);
create index if not exists beats_key_idx      on public.beats (key);
create index if not exists beats_visible_idx  on public.beats (is_visible) where is_visible = true;
create index if not exists beats_featured_idx
  on public.beats (is_featured, featured_order)
  where is_featured = true;

drop trigger if exists beats_set_updated_at on public.beats;
create trigger beats_set_updated_at
  before update on public.beats
  for each row execute function public.set_updated_at();


-- 3.3 · USER PROFILES --------------------------------------------------------

create table if not exists public.user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  display_name  text,
  phone         text,
  instagram     text,
  soundcloud    text,
  spotify       text,
  avatar_url    text,
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists user_profiles_email_idx    on public.user_profiles (email);
create index if not exists user_profiles_is_admin_idx on public.user_profiles (is_admin) where is_admin = true;

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();


-- 3.4 · SALES ----------------------------------------------------------------

create table if not exists public.sales (
  id              uuid primary key default uuid_generate_v4(),
  invoice_id      text not null unique,
  beat_id         uuid references public.beats(id) on delete set null,
  user_id         uuid references auth.users(id)  on delete set null,
  status          sale_status not null default 'Pendiente',
  payment_method  payment_method not null,
  amount_cents    integer not null check (amount_cents >= 0),
  currency        text not null default 'USD',
  buyer_email     text not null,
  created_at      timestamptz not null default now()
);

-- Forward-compatibility for older databases.
alter table public.sales add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists sales_status_idx  on public.sales (status);
create index if not exists sales_created_idx on public.sales (created_at desc);
create index if not exists sales_user_idx    on public.sales (user_id);
create index if not exists sales_beat_idx    on public.sales (beat_id);


-- ============================================================================
-- 4) AUTH ↔ user_profiles INTEGRATION
-- ============================================================================

-- 4.1 · Auto-create a profile row when a user signs up via Supabase Auth.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();


-- 4.2 · Mirror auth.users.email → user_profiles.email when it changes.
create or replace function public.sync_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.user_profiles
    set email = new.email
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_synced on auth.users;
create trigger on_auth_user_email_synced
  after update of email on auth.users
  for each row execute function public.sync_email_from_auth();


-- 4.3 · Mirror auth.users.app_metadata.is_admin → user_profiles.is_admin.
create or replace function public.sync_admin_flag_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_profiles
  set is_admin = coalesce((new.raw_app_meta_data->>'is_admin')::boolean, false)
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_admin_synced on auth.users;
create trigger on_auth_user_admin_synced
  after update of raw_app_meta_data on auth.users
  for each row execute function public.sync_admin_flag_from_auth();


-- ============================================================================
-- 5) ROW LEVEL SECURITY
-- ============================================================================
-- Server-side code uses the SERVICE_ROLE key for write operations, which bypasses
-- RLS entirely. The policies below cover the SSR/client paths (authenticated
-- and anon). No anonymous write policies are exposed on purpose.

alter table public.categories    enable row level security;
alter table public.beats         enable row level security;
alter table public.sales         enable row level security;
alter table public.user_profiles enable row level security;

-- 5.1 · CATEGORIES ----------------------------------------------------------
-- Public read (catalog filters are unauthenticated).

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
  for select using (true);

-- 5.2 · BEATS ---------------------------------------------------------------
-- Public can only see beats explicitly marked as visible. Scheduled releases
-- still gate via the `release_date` column on the application side.

drop policy if exists "beats_public_read_visible" on public.beats;
create policy "beats_public_read_visible" on public.beats
  for select using (is_visible = true);

drop policy if exists "beats_admin_read_all" on public.beats;
create policy "beats_admin_read_all" on public.beats
  for select using (public.is_current_user_admin());

-- 5.3 · USER PROFILES -------------------------------------------------------
-- Users can read/update only their own row. Admins can read all rows.

drop policy if exists "user_profiles_self_select" on public.user_profiles;
create policy "user_profiles_self_select" on public.user_profiles
  for select using (auth.uid() = id);

drop policy if exists "user_profiles_self_update" on public.user_profiles;
create policy "user_profiles_self_update" on public.user_profiles
  for update using (auth.uid() = id);

drop policy if exists "user_profiles_admin_select" on public.user_profiles;
create policy "user_profiles_admin_select" on public.user_profiles
  for select using (public.is_current_user_admin());

-- 5.4 · SALES ---------------------------------------------------------------
-- Users see their own sales; admins see all. Inserts/updates are server-only
-- (service role) to keep webhooks and refunds tamper-proof.

drop policy if exists "sales_self_select" on public.sales;
create policy "sales_self_select" on public.sales
  for select using (
    auth.uid() = user_id
    or (user_id is null and buyer_email = auth.jwt()->>'email')
  );

drop policy if exists "sales_admin_select" on public.sales;
create policy "sales_admin_select" on public.sales
  for select using (public.is_current_user_admin());


-- ============================================================================
-- 6) STORAGE NOTES (run once in the Supabase Dashboard if needed)
-- ============================================================================
-- Avatars bucket (public read for profile photos):
--   insert into storage.buckets (id, name, public)
--   values ('avatars', 'avatars', true)
--   on conflict (id) do nothing;
--
-- All beat assets (audio, video, covers, contracts) live in Cloudflare R2 and
-- are served via the application's signed-URL proxy. No Supabase storage bucket
-- is required for them.


-- ============================================================================
-- 7) ADMIN BOOTSTRAP (one-shot · safe to re-run)
-- ============================================================================
-- Promote the legacy admin email to is_admin and ensure its profile row exists.
-- Replace the email below with the real admin address before running in prod
-- (or run an UPDATE manually).

update auth.users
set raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb),
  '{is_admin}',
  'true'::jsonb
)
where email = 'admin@akpkyy.com';

insert into public.user_profiles (id, email, display_name, is_admin)
select id, email, coalesce(raw_user_meta_data->>'display_name', 'admin'), true
from auth.users
where email = 'admin@akpkyy.com'
on conflict (id) do update set is_admin = true;

-- One-time backfill: reconcile any drift between auth.users.email and
-- user_profiles.email (e.g., users that changed their email before the
-- sync trigger existed).
update public.user_profiles up
set email = au.email
from auth.users au
where up.id = au.id
  and up.email is distinct from au.email;


-- ============================================================================
-- 8) OPTIONAL SEED (commented out)
-- ============================================================================
-- insert into public.categories (name, slug) values
--   ('Trap',    'trap'),
--   ('Jerk',    'jerk'),
--   ('Ambient', 'ambient'),
--   ('Drill',   'drill')
-- on conflict (slug) do nothing;

-- ============================================================================
-- END · akpkyy master schema
-- ============================================================================
