-- Per-form media catalog. Placed photos stay on locations.gallery_media and
-- venue_spaces. The public form never reads this table.

create table if not exists public.location_media (
  id          uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations (id) on delete cascade,
  type        text not null,
  src         text not null,
  thumb       text,
  poster      text,
  alt         text not null default '',
  provider    text,
  created_at  timestamptz not null default now(),
  unique (location_id, src),
  constraint location_media_type_check check (type in ('image', 'video', 'embed'))
);

create index if not exists location_media_location_created_idx
  on public.location_media (location_id, created_at desc, id desc);

alter table public.location_media enable row level security;

drop policy if exists "admins manage their org location media" on public.location_media;
create policy "admins manage their org location media"
  on public.location_media
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.locations
      where locations.id = location_media.location_id
        and locations.org_id = public.current_org_id()
    )
  )
  with check (
    exists (
      select 1
      from public.locations
      where locations.id = location_media.location_id
        and locations.org_id = public.current_org_id()
    )
  );

grant select, insert, update, delete on table public.location_media to authenticated;

insert into public.location_media (location_id, type, src, poster, alt, provider, created_at)
select location_id, type, src, poster, alt, provider, created_at
from (
  select distinct on (location_id, src)
    location_id,
    type,
    src,
    poster,
    alt,
    provider,
    now() - (ord * interval '1 millisecond') as created_at
  from (
    select
      l.id as location_id,
      item->>'type' as type,
      item->>'src' as src,
      nullif(item->>'poster', '') as poster,
      coalesce(item->>'alt', '') as alt,
      nullif(item->>'provider', '') as provider,
      g.ordinality as ord
    from public.locations l
    cross join lateral jsonb_array_elements(coalesce(l.gallery_media, '[]'::jsonb))
      with ordinality as g(item, ordinality)

    union all

    select
      l.id,
      item->>'type',
      item->>'src',
      nullif(item->>'poster', ''),
      coalesce(item->>'alt', ''),
      nullif(item->>'provider', ''),
      1000000 + (s.ordinality * 1000) + m.ordinality
    from public.locations l
    cross join lateral jsonb_array_elements(coalesce(l.venue_spaces, '[]'::jsonb))
      with ordinality as s(space, ordinality)
    cross join lateral jsonb_array_elements(coalesce(s.space->'galleryMedia', '[]'::jsonb))
      with ordinality as m(item, ordinality)
  ) raw
  where coalesce(src, '') <> ''
    and type in ('image', 'video', 'embed')
  order by location_id, src, ord
) deduped
on conflict (location_id, src) do nothing;
