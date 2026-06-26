-- Per-location form step configuration (replaces unused form_schema from 0004)
alter table public.locations
  add column if not exists form_steps jsonb not null default '[]'::jsonb,
  add column if not exists step_more_details jsonb not null default '{}'::jsonb,
  add column if not exists timing_style text not null default 'standard',
  add column if not exists info_page jsonb;

alter table public.locations drop column if exists form_schema;
