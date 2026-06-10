import type { ReferralSource } from "./types";

export const TRIPLESEAT_CONFIG = {
  publicKey: import.meta.env.VITE_TRIPLESEAT_PUBLIC_KEY ?? "",
  leadFormId: import.meta.env.VITE_TRIPLESEAT_LEAD_FORM_ID
    ? Number(import.meta.env.VITE_TRIPLESEAT_LEAD_FORM_ID)
    : undefined,
  locationId: import.meta.env.VITE_TRIPLESEAT_LOCATION_ID
    ? Number(import.meta.env.VITE_TRIPLESEAT_LOCATION_ID)
    : undefined,
  apiBaseUrl: "https://api.tripleseat.com/v1",
};

/**
 * Maps each form referral option to a Tripleseat native "Referred By"
 * (referral_source_id). These IDs are SITE-SPECIFIC — the values below are for
 * the Roscioli site. When adding other locations/sites, confirm the IDs via:
 *   https://api.tripleseat.com/v1/sites.json?public_key=YOUR_KEY
 * Options with no native equivalent fall back to "Other" (id 1) and pass their
 * label through referral_source_other.
 */
export const REFERRAL_SOURCE_IDS: Record<ReferralSource, number> = {
  instagram: 6,
  tiktok: 11888,
  facebook: 5,
  google: 3, // "Search Engine"
  friend: 10746, // "Friends/Family"
  blog: 1, // "Other" (no native Blog/Press source)
  other: 1, // "Other"
};

/** Referral options that map to the native "Other" source and need free text. */
export const REFERRAL_OTHER_SOURCE_ID = 1;
