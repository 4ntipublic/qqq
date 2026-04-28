-- ============================================================================
-- Migration: add `key` (musical key / tone) column to public.beats
-- ----------------------------------------------------------------------------
-- Run once in the Supabase SQL editor (or via supabase db push).
-- Free-form text so we can store any notation: "Cm", "F# Major", "Ab Minor", etc.
-- ============================================================================

alter table public.beats
  add column if not exists key text;

create index if not exists beats_key_idx on public.beats (key);
