-- Bookable time windows. Null means the legacy 9:00 AM–11:30 PM range.
alter table public.locations
  add column if not exists timing_hours jsonb;
