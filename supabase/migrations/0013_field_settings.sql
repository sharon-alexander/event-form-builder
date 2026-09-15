-- Per-question settings (shown, required, future flags). Missing keys use
-- catalog defaults in src/form/fieldCatalog.ts.
-- Backfills existing required_fields booleans into { required: <bool> }.
alter table public.locations
  add column if not exists field_settings jsonb not null default '{}'::jsonb;

update public.locations
  set field_settings = (
    select coalesce(
      jsonb_object_agg(key, jsonb_build_object('required', value)),
      '{}'::jsonb
    )
    from jsonb_each(required_fields)
  )
  where required_fields is not null
    and required_fields <> '{}'::jsonb
    and field_settings = '{}'::jsonb;
