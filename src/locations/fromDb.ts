import { supabase, supabasePublic } from "../lib/supabase";
import type { ThemeTokens } from "../theme/theme";
import { mergeInfoPageIntoMoreDetails } from "../utils/richText";
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
    logoUrl: row.theme?.logoUrl,
    galleryMedia: row.gallery_media ?? [],
    venueSpaces: row.venue_spaces ?? [],
    budgetOptions: row.budget_options ?? [],
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
  const client = preview ? supabase : supabasePublic;
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
