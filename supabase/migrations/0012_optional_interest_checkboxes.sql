-- Optional guest-facing interest checkboxes, off unless an admin enables them.
alter table public.locations
  add column if not exists show_multi_day_rental boolean not null default false,
  add column if not exists show_additional_load_in_out boolean not null default false,
  add column if not exists show_full_day_rental boolean not null default false;
