-- ============================================================================
-- Admin user management — RLS for super_admins to manage org members
-- ============================================================================

-- ── helpers ─────────────────────────────────────────────────────────────────
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.count_super_admins(target_org_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.profiles
  where org_id = target_org_id and role = 'super_admin';
$$;

-- ── RLS: super_admins can list all profiles in their org ────────────────────
drop policy if exists "super admins read org profiles" on public.profiles;
create policy "super admins read org profiles"
  on public.profiles
  for select
  to authenticated
  using (org_id = public.current_org_id() and public.is_super_admin());

-- ── RLS: super_admins can change roles on other org members ─────────────────
drop policy if exists "super admins update org member roles" on public.profiles;
create policy "super admins update org member roles"
  on public.profiles
  for update
  to authenticated
  using (
    org_id = public.current_org_id()
    and public.is_super_admin()
    and id != auth.uid()
  )
  with check (
    org_id = public.current_org_id()
    and role in ('super_admin', 'editor')
  );

-- ── trigger: never leave an org without a super_admin ───────────────────────
create or replace function public.protect_last_super_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining int;
begin
  if TG_OP = 'DELETE' then
    if OLD.role = 'super_admin' then
      remaining := public.count_super_admins(OLD.org_id);
      if remaining <= 1 then
        raise exception 'Cannot remove the last super_admin from an organization';
      end if;
    end if;
    return OLD;
  elsif TG_OP = 'UPDATE' then
    if OLD.role = 'super_admin' and NEW.role is distinct from 'super_admin' then
      remaining := public.count_super_admins(OLD.org_id);
      if remaining <= 1 then
        raise exception 'Cannot demote the last super_admin in an organization';
      end if;
    end if;
    return NEW;
  end if;
  return null;
end;
$$;

drop trigger if exists protect_last_super_admin on public.profiles;
create trigger protect_last_super_admin
  before update or delete on public.profiles
  for each row execute function public.protect_last_super_admin();
