-- ============================================================================
-- Track whether an invited admin has finished onboarding (set a password).
-- ============================================================================

alter table public.profiles
  add column if not exists joined_at timestamptz;

-- Anyone who has already signed in is treated as joined.
update public.profiles p
set joined_at = u.last_sign_in_at
from auth.users u
where p.id = u.id
  and p.joined_at is null
  and u.last_sign_in_at is not null;

-- Called after an invitee (or password-reset user) successfully sets a password.
create or replace function public.accept_admin_invite()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set joined_at = coalesce(joined_at, now())
  where id = auth.uid();
end;
$$;

revoke all on function public.accept_admin_invite() from public;
grant execute on function public.accept_admin_invite() to authenticated;
