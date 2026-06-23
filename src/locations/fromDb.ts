import { supabase } from "../lib/supabase";
import type { ThemeTokens } from "../theme/theme";
import { DEFAULT_LOCATION_ID } from "./index";
import type {
  BudgetOption,
  LocationConfig,
  MediaItem,
  TripleseatConfig,
  VenueSpaceOption,
} from "./types";

/** Shape of a row in the Supabase `locations` table. */
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
  theme: ThemeTokens | null;
  published: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Map a database row to the runtime `LocationConfig` consumed by the form. */
export function locationConfigFromRow(row: LocationRow): LocationConfig {
  return {
    id: row.slug,
    name: row.name,
    formTitle: row.form_title,
    aboutBlurb: row.about_blurb,
    galleryMedia: row.gallery_media ?? [],
    venueSpaces: row.venue_spaces ?? [],
    budgetOptions: row.budget_options ?? [],
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

/**
 * Fetch a published location by slug from Supabase. Returns `null` when Supabase
 * isn't configured or no published row matches — callers fall back to the
 * bundled TypeScript configs.
 */
export async function fetchLocationBySlug(
  slug: string | null | undefined,
): Promise<ResolvedLocation | null> {
  if (!supabase) return null;

  const target = slug || DEFAULT_LOCATION_ID;
  const { data, error } = await supabase
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
