-- Not applied yet. Leave this file unpushed until the CMS logic UI is accepted.
--
-- Seed form_rules for the three live forms. The app does not special-case these
-- slugs; it only reads the rules written here.
--
-- Tokyo Record Bar: headcount min/max live on field_settings (warn under 7, block
-- over 40). The $1,500–$2,500 budget cap is hidden above 15 guests, and each
-- space has a guest range. Large-table options use the smaller
-- caps already published on the form (Cocktail Bar large table 7–15, Vinyl
-- Jukebox large table 7–10). Buyouts use Cocktail Bar 7–40 and Vinyl Jukebox 7–20.
-- Pearl Box: budget ranges by party size (and day, for the midweek <$6,000
-- option), plus the multi-day and load-in questions and the services step.
-- Roscioli: lunch is Friday–Sunday. Budget ranges below $4,500 are removed.
-- An open-ended "less than" range at or above $4,500 is rewritten to start at $4,500
-- (for example, "Less than $5,000" becomes "$4,500 – $5,000").

create or replace function public._efb_lowest_amount(label text)
returns numeric
language plpgsql
immutable
as $$
declare
  amounts numeric[];
begin
  select array_agg((regexp_replace(m.captures[1], ',', '', 'g'))::numeric)
    into amounts
  from regexp_matches(coalesce(label, ''), '(\d{1,3}(?:,\d{3})+|\d+)', 'g') as m(captures);

  if amounts is null or cardinality(amounts) = 0 then
    return null;
  end if;

  return (select min(v) from unnest(amounts) as v);
end;
$$;

revoke all on function public._efb_lowest_amount(text) from public, anon, authenticated;

create or replace function public._efb_hide_rule(
  rule_id text,
  field text,
  option_value text,
  show_when jsonb
)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'id', rule_id,
    'enabled', true,
    'when', jsonb_build_object('not', show_when),
    'then', jsonb_build_array(
      jsonb_build_object(
        'kind', 'hideOption',
        'field', field,
        'optionValue', option_value
      )
    )
  );
$$;

revoke all on function public._efb_hide_rule(text, text, text, jsonb) from public, anon, authenticated;

create or replace function public._efb_guest_range_when(min_guests int, max_guests int)
returns jsonb
language plpgsql
immutable
as $$
declare
  parts jsonb := '[]'::jsonb;
begin
  if min_guests is not null then
    parts := parts || jsonb_build_array(jsonb_build_object(
      'field', 'guestCount',
      'op', 'gte',
      'value', min_guests,
      'passIfEmpty', true
    ));
  end if;
  if max_guests is not null then
    parts := parts || jsonb_build_array(jsonb_build_object(
      'field', 'guestCount',
      'op', 'lte',
      'value', max_guests,
      'passIfEmpty', true
    ));
  end if;
  if jsonb_array_length(parts) = 1 then
    return parts -> 0;
  end if;
  return jsonb_build_object('all', parts);
end;
$$;

revoke all on function public._efb_guest_range_when(int, int) from public, anon, authenticated;

-- Tokyo Record Bar -----------------------------------------------------------
update public.locations
set
  field_settings = jsonb_set(
    coalesce(field_settings, '{}'::jsonb),
    '{guestCount}',
    coalesce(field_settings->'guestCount', '{}'::jsonb) || jsonb_build_object(
      'min', jsonb_build_object(
        'value', 7,
        'behavior', 'warn',
        'messageHtml', '<p>For groups smaller than 7, please <a href="https://www.sevenrooms.com">book on 7Rooms</a>.</p>'
      ),
      'max', jsonb_build_object(
        'value', 40,
        'behavior', 'block',
        'messageHtml', '<p>This space holds up to 40 guests. Enter 40 or fewer to continue.</p>'
      )
    ),
    true
  ),
  form_rules = jsonb_build_object(
  'version', 1,
  'rules', (
    select coalesce(jsonb_agg(rule), '[]'::jsonb)
    from (
      select public._efb_hide_rule(
        'tokyo_budget_' || (elem->>'value'),
        'budget',
        elem->>'value',
        public._efb_guest_range_when(null, 15)
      ) as rule
      from jsonb_array_elements(budget_options) as elem
      where coalesce(elem->>'label', '') ~* '1[,.]?500'
        and coalesce(elem->>'label', '') ~* '2[,.]?500'
        and coalesce(elem->>'value', '') <> ''
      union all
      select public._efb_hide_rule(
        'tokyo_space_' || (elem->>'value'),
        'venueSpace',
        elem->>'value',
        public._efb_guest_range_when(
          7,
          case
            when coalesce(elem->>'label', '') ~* 'cocktail'
             and coalesce(elem->>'label', '') ~* 'large[[:space:]]*table' then 15
            when coalesce(elem->>'label', '') ~* 'cocktail' then 40
            when coalesce(elem->>'label', '') ~* 'vinyl|jukebox'
             and coalesce(elem->>'label', '') ~* 'large[[:space:]]*table' then 10
            when coalesce(elem->>'label', '') ~* 'vinyl|jukebox' then 20
            else null
          end
        )
      )
      from jsonb_array_elements(venue_spaces) as elem
      where coalesce(elem->>'value', '') <> ''
        and (
          coalesce(elem->>'label', '') ~* 'cocktail'
          or coalesce(elem->>'label', '') ~* 'vinyl|jukebox'
        )
    ) rules
  )
)
where slug = 'tokyo-record-bar';

-- Pearl Box ------------------------------------------------------------------
update public.locations
set
  show_multi_day_rental = true,
  show_additional_load_in_out = true,
  budget_options = '[
    {"value":"lp_under_1000","label":"Less than $1,000"},
    {"value":"lp_1000_1300","label":"$1,000 – $1,300"},
    {"value":"lp_1300_1600","label":"$1,300 – $1,600"},
    {"value":"lp_1600_plus","label":"$1,600+"},
    {"value":"g15_under_5000","label":"Less than $5,000"},
    {"value":"g15_5000_7000","label":"$5,000 – $7,000"},
    {"value":"g15_7000_9000","label":"$7,000 – $9,000"},
    {"value":"g15_9000_plus","label":"$9,000+"},
    {"value":"g36_under_6000","label":"Less than $6,000"},
    {"value":"g36_6000_10000","label":"$6,000 – $10,000"},
    {"value":"g36_10000_15000","label":"$10,000 – $15,000"},
    {"value":"g36_15000_plus","label":"$15,000+"},
    {"value":"g76_under_26000","label":"Less than $26,000"},
    {"value":"g76_26000_28000","label":"$26,000 – $28,000"},
    {"value":"g76_28000_30000","label":"$28,000 – $30,000"},
    {"value":"g76_30000_plus","label":"$30,000+"}
  ]'::jsonb,
  form_rules = jsonb_build_object(
    'version', 1,
    'rules', jsonb_build_array(
      public._efb_hide_rule('pb_lp_under_1000', 'budget', 'lp_under_1000', jsonb_build_object('all', jsonb_build_array(
        jsonb_build_object('field', 'guestCount', 'op', 'lte', 'value', 14, 'passIfEmpty', true),
        jsonb_build_object('field', 'bookingType', 'op', 'in', 'value', jsonb_build_array('large_party'), 'passIfEmpty', true)
      ))),
      public._efb_hide_rule('pb_lp_1000_1300', 'budget', 'lp_1000_1300', jsonb_build_object('all', jsonb_build_array(
        jsonb_build_object('field', 'guestCount', 'op', 'lte', 'value', 14, 'passIfEmpty', true),
        jsonb_build_object('field', 'bookingType', 'op', 'in', 'value', jsonb_build_array('large_party'), 'passIfEmpty', true)
      ))),
      public._efb_hide_rule('pb_lp_1300_1600', 'budget', 'lp_1300_1600', jsonb_build_object('all', jsonb_build_array(
        jsonb_build_object('field', 'guestCount', 'op', 'lte', 'value', 14, 'passIfEmpty', true),
        jsonb_build_object('field', 'bookingType', 'op', 'in', 'value', jsonb_build_array('large_party'), 'passIfEmpty', true)
      ))),
      public._efb_hide_rule('pb_lp_1600_plus', 'budget', 'lp_1600_plus', jsonb_build_object('all', jsonb_build_array(
        jsonb_build_object('field', 'guestCount', 'op', 'lte', 'value', 14, 'passIfEmpty', true),
        jsonb_build_object('field', 'bookingType', 'op', 'in', 'value', jsonb_build_array('large_party'), 'passIfEmpty', true)
      ))),
      public._efb_hide_rule('pb_g15_under_5000', 'budget', 'g15_under_5000', public._efb_guest_range_when(15, 35)),
      public._efb_hide_rule('pb_g15_5000_7000', 'budget', 'g15_5000_7000', public._efb_guest_range_when(15, 35)),
      public._efb_hide_rule('pb_g15_7000_9000', 'budget', 'g15_7000_9000', public._efb_guest_range_when(15, 35)),
      public._efb_hide_rule('pb_g15_9000_plus', 'budget', 'g15_9000_plus', public._efb_guest_range_when(15, 35)),
      public._efb_hide_rule('pb_g36_under_6000', 'budget', 'g36_under_6000', jsonb_build_object('all', jsonb_build_array(
        jsonb_build_object('field', 'guestCount', 'op', 'gte', 'value', 36, 'passIfEmpty', true),
        jsonb_build_object('field', 'guestCount', 'op', 'lte', 'value', 75, 'passIfEmpty', true),
        jsonb_build_object('field', 'eventDate', 'op', 'weekdayIn', 'value', jsonb_build_array('Sunday', 'Monday', 'Tuesday', 'Wednesday'), 'passIfEmpty', true)
      ))),
      public._efb_hide_rule('pb_g36_6000_10000', 'budget', 'g36_6000_10000', public._efb_guest_range_when(36, 75)),
      public._efb_hide_rule('pb_g36_10000_15000', 'budget', 'g36_10000_15000', public._efb_guest_range_when(36, 75)),
      public._efb_hide_rule('pb_g36_15000_plus', 'budget', 'g36_15000_plus', public._efb_guest_range_when(36, 75)),
      public._efb_hide_rule('pb_g76_under_26000', 'budget', 'g76_under_26000', public._efb_guest_range_when(76, null)),
      public._efb_hide_rule('pb_g76_26000_28000', 'budget', 'g76_26000_28000', public._efb_guest_range_when(76, null)),
      public._efb_hide_rule('pb_g76_28000_30000', 'budget', 'g76_28000_30000', public._efb_guest_range_when(76, null)),
      public._efb_hide_rule('pb_g76_30000_plus', 'budget', 'g76_30000_plus', public._efb_guest_range_when(76, null))
    )
  )
where slug = 'pearl-box';

-- Keep the services step on the form, just before contact when that step exists.
do $$
declare
  steps jsonb;
  i int;
  inserted jsonb := '[]'::jsonb;
  placed boolean := false;
begin
  select form_steps into steps
  from public.locations
  where slug = 'pearl-box';

  if steps is null or jsonb_typeof(steps) <> 'array' or jsonb_array_length(steps) = 0 then
    return;
  end if;

  if steps @> '["services"]'::jsonb then
    return;
  end if;

  for i in 0 .. jsonb_array_length(steps) - 1 loop
    if steps ->> i = 'contact' and not placed then
      inserted := inserted || jsonb_build_array('services');
      placed := true;
    end if;
    inserted := inserted || jsonb_build_array(steps -> i);
  end loop;

  if not placed then
    inserted := inserted || jsonb_build_array('services');
  end if;

  update public.locations
  set form_steps = inserted
  where slug = 'pearl-box';
end;
$$;

-- Roscioli --------------------------------------------------------------------
update public.locations
set form_rules = jsonb_build_object(
  'version', 1,
  'rules', jsonb_build_array(
    public._efb_hide_rule(
      'roscioli_lunch_days',
      'mealService',
      'lunch',
      jsonb_build_object(
        'field', 'eventDate',
        'op', 'weekdayIn',
        'value', jsonb_build_array('Friday', 'Saturday', 'Sunday'),
        'passIfEmpty', true
      )
    )
  )
)
where slug = 'roscioli';

update public.locations
set budget_options = (
  select coalesce(jsonb_agg(
    case
      when coalesce(elem->>'label', '') ~* 'less than|under|<'
       and public._efb_lowest_amount(elem->>'label') >= 4500
      then jsonb_set(
        elem,
        '{label}',
        to_jsonb(
          '$4,500 – $' || trim(to_char(public._efb_lowest_amount(elem->>'label'), 'FM999,999,999'))
        )
      )
      else elem
    end
    order by ord
  ), '[]'::jsonb)
  from jsonb_array_elements(budget_options) with ordinality as t(elem, ord)
  where public._efb_lowest_amount(elem->>'label') is null
     or public._efb_lowest_amount(elem->>'label') >= 4500
)
where slug = 'roscioli';

drop function public._efb_hide_rule(text, text, text, jsonb);
drop function public._efb_guest_range_when(int, int);
drop function public._efb_lowest_amount(text);
