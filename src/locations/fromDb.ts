import { supabasePublic } from "../lib/supabase";
import type { ThemeTokens } from "../theme/theme";
import { DEFAULT_LOCATION_ID, tryGetLocation } from "./index";
import type {
  BudgetOption,
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
  tripleseat: Partial<TripleseatConfig> | null;
  referral_source_ids: Record<string, number> | null;
  referral_other_source_id: number | null;
  form_steps: StepId[] | null;
  step_more_details: Partial<Record<StepId, string>> | null;
  timing_style: string | null;
  info_page: InfoPageConfig | null;
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
    galleryMedia: row.gallery_media ?? [],
    venueSpaces: row.venue_spaces ?? [],
    budgetOptions: row.budget_options ?? [],
    steps,
    stepMoreDetails: {
      ...bundled?.stepMoreDetails,
      ...row.step_more_details,
    },
    timingStyle:
      (row.timing_style as LocationConfig["timingStyle"]) ||
      bundled?.timingStyle ||
      "standard",
    infoPage: row.info_page ?? bundled?.infoPage,
    stepCopy: bundled?.stepCopy,
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
}

export async function fetchLocationBySlug(
  slug: string | null | undefined,
): Promise<ResolvedLocation | null> {
  if (!supabasePublic) return null;

  const target = slug || DEFAULT_LOCATION_ID;
  const { data, error } = await supabasePublic
    .from("locations")
    .select("*")
    .eq("slug", target)
    .eq("published", true)
    .maybeSingle<LocationRow>();

  if (error || !data) return null;

  return {
    config: locationConfigFromRow(data),
    theme: data.theme ?? null,
  };
}
