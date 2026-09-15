-- field_settings is the source of truth (backfilled in 0013).
alter table public.locations
  drop column if exists required_fields;
