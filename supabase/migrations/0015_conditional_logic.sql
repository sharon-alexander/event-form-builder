-- Versioned form rules. Empty rules mean no conditional logic.
alter table public.locations
  add column if not exists form_rules jsonb not null default '{"version":1,"rules":[]}'::jsonb;
