-- ============================================================================
-- akpkyy · Phase 5 · Users system + Featured beats
-- ============================================================================
-- Apply via `supabase db push` or paste into the Supabase SQL editor.
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1) USER PROFILES ===========================================================

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

create index if not exists user_profiles_email_idx on public.user_profiles (email);
create index if not exists user_profiles_is_admin_idx on public.user_profiles (is_admin) where is_admin = true;

-- updated_at trigger
drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- 2) AUTO-CREATE PROFILE ON AUTH SIGNUP ======================================

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

-- 3) SYNC user_profiles.is_admin <-> auth.users.app_metadata.is_admin =======
-- The middleware reads the JWT claim (auth.users.raw_app_meta_data.is_admin).
-- We mirror this flag on user_profiles for admin UI queries (Phase 7).

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

-- 4) ROW LEVEL SECURITY =====================================================

alter table public.user_profiles enable row level security;

-- Helper that bypasses RLS recursion when checking admin status.
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

-- Users can read/update their own profile.
drop policy if exists "user_profiles_self_select" on public.user_profiles;
create policy "user_profiles_self_select" on public.user_profiles
  for select using (auth.uid() = id);

drop policy if exists "user_profiles_self_update" on public.user_profiles;
create policy "user_profiles_self_update" on public.user_profiles
  for update using (auth.uid() = id);

-- Admins can read all profiles (for the admin user list in Phase 7).
drop policy if exists "user_profiles_admin_select" on public.user_profiles;
create policy "user_profiles_admin_select" on public.user_profiles
  for select using (public.is_current_user_admin());

-- 5) FEATURED BEATS =========================================================

do $$ begin
  create type featured_format as enum ('grid', 'list');
exception when duplicate_object then null; end $$;

alter table public.beats add column if not exists is_featured boolean not null default false;
alter table public.beats add column if not exists featured_format featured_format not null default 'grid';
alter table public.beats add column if not exists featured_order integer;

create index if not exists beats_featured_idx
  on public.beats (is_featured, featured_order)
  where is_featured = true;

-- 6) SALES → USER LINK =====================================================
-- Optional FK: existing sales without a user_id keep buyer_email as identifier.

alter table public.sales add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists sales_user_idx on public.sales (user_id);

-- 7) BACKFILL EXISTING ADMIN ===============================================
-- Mark the legacy admin email as is_admin in auth.users (JWT claim) and mirror.

update auth.users
set raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb),
  '{is_admin}',
  'true'::jsonb
)
where email = 'admin@akpkyy.com';

-- Ensure profile row exists for the admin (in case admin was created before this migration).
insert into public.user_profiles (id, email, display_name, is_admin)
select id, email, coalesce(raw_user_meta_data->>'display_name', 'pible antipuvlic'), true
from auth.users
where email = 'admin@akpkyy.com'
on conflict (id) do update set is_admin = true;
