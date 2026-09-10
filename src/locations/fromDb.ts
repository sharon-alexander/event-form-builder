import { getSupabase, supabasePublic } from "../lib/supabase";
import { DEFAULT_EVENT_CATEGORIES, EVENT_FORMATS } from "../types";
import type { ThemeTokens } from "../theme/theme";
import { mergeInfoPageIntoMoreDetails } from "../utils/richText";
import { parseRequiredFields } from "../form/fieldCatalog";
import { DEFAULT_LOCATION_ID, tryGetLocation } from "./index";
import { hasOptionLabel } from "./presentableOptions";
import type {
  BudgetOption,
  EventChoiceOption,
  FieldId,
  InfoPageConfig,
  LocationConfig,
  MediaItem,
  StepId,
  TripleseatConfig,
  VenueSpaceOption,
} from "./types";

export interface LocationRow {
  id: string;
  org_id: string;
  slug: string;
  name: string;
  form_title: string;
  about_blurb: string;
  gallery_media: MediaItem[] | null;
  venue_spaces: VenueSpaceOption[] | null;
  budget_options: BudgetOption[] | null;
  event_categories: EventChoiceOption[] | null;
  event_formats: EventChoiceOption[] | null;
  tripleseat: Partial<TripleseatConfig> | null;
  referral_source_ids: Record<string, number> | null;
  referral_other_source_id: number | null;
  form_steps: StepId[] | null;
  step_more_details: Partial<Record<StepId, string>> | null;
  timing_style: string | null;
  allow_multiple_venue_spaces: boolean | null;
  show_multi_day_rental: boolean | null;
  show_additional_load_in_out: boolean | null;
  show_full_day_rental: boolean | null;
  info_page: InfoPageConfig | null;
  required_fields: Partial<Record<FieldId, boolean>> | null;
  theme: ThemeTokens | null;
  published: boolean;
  created_at?: string;
  updated_at?: string;
}

export function locationConfigFromRow(row: LocationRow): LocationConfig {
  const bundled = tryGetLocation(row.slug);
  const steps =
    row.form_steps && row.form_steps.length > 0
      ? row.form_steps
      : bundled?.steps ?? [];

  return {
    id: row.slug,
    name: row.name,
    formTitle: row.form_title,
    aboutBlurb: row.about_blurb,
    logoUrl: row.theme?.logoUrl,
    galleryMedia: row.gallery_media ?? [],
    venueSpaces: (row.venue_spaces ?? []).filter(hasOptionLabel),
    allowMultipleVenueSpaces:
      row.allow_multiple_venue_spaces ??
      bundled?.allowMultipleVenueSpaces ??
      false,
    showMultiDayRental:
      row.show_multi_day_rental ?? bundled?.showMultiDayRental ?? false,
    showAdditionalLoadInOut:
      row.show_additional_load_in_out ??
      bundled?.showAdditionalLoadInOut ??
      false,
    showFullDayRental:
      row.show_full_day_rental ?? bundled?.showFullDayRental ?? false,
    budgetOptions: (row.budget_options ?? []).filter(hasOptionLabel),
    eventCategories: row.event_categories ?? DEFAULT_EVENT_CATEGORIES,
    eventFormats: row.event_formats ?? EVENT_FORMATS,
    steps,
    stepMoreDetails: {
      ...bundled?.stepMoreDetails,
      ...mergeInfoPageIntoMoreDetails(
        row.step_more_details ?? {},
        row.info_page ?? bundled?.infoPage,
      ),
    },
    timingStyle:
      (row.timing_style as LocationConfig["timingStyle"]) ||
      bundled?.timingStyle ||
      "standard",
    infoPage: (() => {
      const page = row.info_page ?? bundled?.infoPage;
      return page ? { title: page.title } : undefined;
    })(),
    stepCopy: bundled?.stepCopy,
    requiredFields: parseRequiredFields(row.required_fields),
    tripleseat: {
      publicKey: row.tripleseat?.publicKey ?? "",
      leadFormId: row.tripleseat?.leadFormId,
      locationId: row.tripleseat?.locationId,
      apiBaseUrl: row.tripleseat?.apiBaseUrl || "https://api.tripleseat.com/v1",
    },
    referralSourceIds: row.referral_source_ids ?? {},
    referralOtherSourceId: row.referral_other_source_id ?? 1,
  };
}

export interface ResolvedLocation {
  config: LocationConfig;
  theme: ThemeTokens | null;
  published: boolean;
}

export async function fetchLocationBySlug(
  slug: string | null | undefined,
  options?: { preview?: boolean },
): Promise<ResolvedLocation | null> {
  const preview = options?.preview === true;
  // Preview needs the signed-in client for unpublished rows. Don't call
  // getSupabase() on the public path — that would start auth recovery and can
  // stall the first load on "Loading…".
  const client = preview ? getSupabase() : supabasePublic;
  if (!client) return null;

  const target = slug || DEFAULT_LOCATION_ID;
  let query = client.from("locations").select("*").eq("slug", target);
  if (!preview) {
    query = query.eq("published", true);
  }
  const { data, error } = await query.maybeSingle<LocationRow>();

  if (error || !data) return null;

  return {
    config: locationConfigFromRow(data),
    theme: data.theme ?? null,
    published: data.published,
  };
}
