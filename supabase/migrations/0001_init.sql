-- ============================================================================
-- Event Form Builder CMS — initial schema
--
-- Tables:
--   organizations  - a restaurant "group" that owns one or more event forms
--   profiles       - an admin user, linked to auth.users, scoped to one org
--   locations      - a single event form (content, gallery, options, theme)
--
-- Multi-tenancy: every admin belongs to exactly one organization. Row Level
-- Security restricts admins to the locations within their own organization.
-- The public (anon) role can only read locations that are published.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── organizations ───────────────────────────────────────────────────────────
create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

-- ── profiles (one row per admin user) ────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  org_id     uuid not null references public.organizations (id) on delete cascade,
  role       text not null default 'super_admin',
  email      text,
  created_at timestamptz not null default now()
);

create index if not exists profiles_org_id_idx on public.profiles (org_id);

-- ── locations (one row per event form) ───────────────────────────────────────
create table if not exists public.locations (
  id                        uuid primary key default gen_random_uuid(),
  org_id                    uuid not null references public.organizations (id) on delete cascade,
  slug                      text not null unique,
  name                      text not null,
  form_title                text not null default 'Private Events',
  about_blurb               text not null default '',
  gallery_media             jsonb not null default '[]'::jsonb,
  venue_spaces              jsonb not null default '[]'::jsonb,
  budget_options            jsonb not null default '[]'::jsonb,
  tripleseat                jsonb not null default '{}'::jsonb,
  referral_source_ids       jsonb not null default '{}'::jsonb,
  referral_other_source_id  integer not null default 1,
  theme                     jsonb not null default '{}'::jsonb,
  published                 boolean not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists locations_org_id_idx on public.locations (org_id);

-- ── helper: the org_id of the currently authenticated user ───────────────────
-- SECURITY DEFINER so it can read profiles without tripping the profiles RLS
-- policy (which would otherwise cause infinite recursion).
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.profiles where id = auth.uid();
$$;

-- ── keep locations.updated_at fresh ──────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists locations_set_updated_at on public.locations;
create trigger locations_set_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.organizations enable row level security;
alter table public.profiles      enable row level security;
alter table public.locations     enable row level security;

-- organizations: an admin can read only their own organization
drop policy if exists "org members can read their org" on public.organizations;
create policy "org members can read their org"
  on public.organizations
  for select
  to authenticated
  using (id = public.current_org_id());

-- profiles: an admin can read only their own profile
drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

-- locations: anyone (including anon) can read published forms
drop policy if exists "public can read published locations" on public.locations;
create policy "public can read published locations"
  on public.locations
  for select
  to anon, authenticated
  using (published = true);

-- locations: admins have full access to forms within their own organization
drop policy if exists "admins manage their org locations" on public.locations;
create policy "admins manage their org locations"
  on public.locations
  for all
  to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
