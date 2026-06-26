-- Add CMS-driven form schema to locations (superseded by 0005)
alter table public.locations
  add column if not exists form_schema jsonb not null default '{"steps":[]}'::jsonb;
