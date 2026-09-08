-- Per-location overrides of whether each catalog question is required.
-- Missing keys use the code catalog defaults. See src/form/fieldCatalog.ts.
alter table public.locations
  add column if not exists required_fields jsonb not null default '{}'::jsonb;
