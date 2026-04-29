-- ============================================================================
-- akpkyy · Phase 8 · Sync auth.users.email → user_profiles.email
-- ============================================================================
-- Apply via `supabase db push` or paste into the Supabase SQL editor.
-- Idempotent: safe to re-run.
-- ============================================================================

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

-- One-time backfill so any drift between auth.users and user_profiles is reconciled.
update public.user_profiles up
set email = au.email
from auth.users au
where up.id = au.id
  and up.email is distinct from au.email;
