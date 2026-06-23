-- ============================================================================
-- Storage bucket for gallery media
--
-- Bucket: "gallery" (public read).
-- Object paths are namespaced by organization:  org/<org_id>/<location_slug>/<file>
-- Admins may only write under their own organization's prefix.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do update set public = true;

-- Public read for every object in the gallery bucket
drop policy if exists "gallery public read" on storage.objects;
create policy "gallery public read"
  on storage.objects
  for select
  using (bucket_id = 'gallery');

-- Admins may upload only under org/<their org_id>/...
drop policy if exists "gallery org insert" on storage.objects;
create policy "gallery org insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'gallery'
    and (storage.foldername(name))[1] = 'org'
    and (storage.foldername(name))[2] = public.current_org_id()::text
  );

-- Admins may overwrite only their own organization's objects
drop policy if exists "gallery org update" on storage.objects;
create policy "gallery org update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'gallery'
    and (storage.foldername(name))[1] = 'org'
    and (storage.foldername(name))[2] = public.current_org_id()::text
  )
  with check (
    bucket_id = 'gallery'
    and (storage.foldername(name))[1] = 'org'
    and (storage.foldername(name))[2] = public.current_org_id()::text
  );

-- Admins may delete only their own organization's objects
drop policy if exists "gallery org delete" on storage.objects;
create policy "gallery org delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'gallery'
    and (storage.foldername(name))[1] = 'org'
    and (storage.foldername(name))[2] = public.current_org_id()::text
  );
