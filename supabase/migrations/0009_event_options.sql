-- Per-form event category and format options shown on the event_format step
alter table public.locations
  add column if not exists event_categories jsonb not null default '[
    {"value":"birthday","label":"Birthday"},
    {"value":"happy_hour","label":"Happy Hour"},
    {"value":"holiday_party","label":"Holiday Party"},
    {"value":"corporate","label":"Corporate Event"},
    {"value":"wedding","label":"Wedding"},
    {"value":"other","label":"Other"}
  ]'::jsonb,
  add column if not exists event_formats jsonb not null default '[
    {"value":"seated","label":"Seated"},
    {"value":"standing","label":"Standing"},
    {"value":"seated_and_standing","label":"Seated + Standing"},
    {"value":"not_sure","label":"Not Sure Yet"}
  ]'::jsonb;
