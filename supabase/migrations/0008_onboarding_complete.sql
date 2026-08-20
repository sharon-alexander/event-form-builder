-- ============================================================================
-- Pending vs joined must not rely on joined_at defaults (which marked brand-new
-- invites as already joined). Explicit onboarding_complete flag instead.
-- ============================================================================

alter table public.profiles
  add column if not exists onboarding_complete boolean not null default false;

-- Clear false positives: joined_at stamped at insert time (≈ created_at).
update public.profiles
set joined_at = null
where joined_at is not null
  and abs(extract(epoch from (joined_at - created_at))) < 5;

-- Anyone who still has a real joined_at completed onboarding previously.
update public.profiles
set onboarding_complete = true
where joined_at is not null;

-- Bootstrapped admins (seed / dashboard) were never email-invited.
update public.profiles p
set
  onboarding_complete = true,
  joined_at = coalesce(p.joined_at, u.last_sign_in_at)
from auth.users u
where p.id = u.id
  and u.invited_at is null
  and u.last_sign_in_at is not null;

alter table public.profiles
  alter column joined_at drop default;

create or replace function public.accept_admin_invite()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    joined_at = coalesce(joined_at, now()),
    onboarding_complete = true
  where id = auth.uid();
end;
$$;

revoke all on function public.accept_admin_invite() from public;
grant execute on function public.accept_admin_invite() to authenticated;
