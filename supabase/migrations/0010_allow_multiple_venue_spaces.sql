-- Whether guests can select more than one venue space of interest
alter table public.locations
  add column if not exists allow_multiple_venue_spaces boolean not null default false;
