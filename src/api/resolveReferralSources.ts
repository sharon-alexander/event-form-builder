import type { ReferralSource } from "../types";
import type { TripleseatConfig } from "../locations/types";

export interface ReferralSourceMapping {
  referralSourceIds: Record<string, number>;
  referralOtherSourceId: number;
}

interface TripleseatReferralSource {
  id: number;
  name: string;
}

interface TripleseatSite {
  id: number;
  name: string;
  referral_sources?: TripleseatReferralSource[];
  billings?: { billing_locations?: { location_id: number }[] }[];
}

/** Fallback when the API is unreachable. Matches Airmax Hospitality's Tripleseat account. */
const DEFAULT_MAPPING: ReferralSourceMapping = {
  referralSourceIds: {
    instagram: 6,
    tiktok: 11888,
    facebook: 5,
    google: 3,
    friend: 10746,
    blog: 1,
    other: 1,
  },
  referralOtherSourceId: 1,
};

/** Maps our form option keys to substrings in Tripleseat referral source names. */
const LABEL_MATCHERS: Record<ReferralSource, string[]> = {
  instagram: ["instagram"],
  tiktok: ["tiktok"],
  facebook: ["facebook"],
  google: ["search engine", "google"],
  friend: ["friends", "family", "word of mouth", "friend"],
  blog: ["blog", "press"],
  other: ["other"],
};

const cache = new Map<string, Promise<ReferralSourceMapping>>();

/**
 * Fetch referral source IDs from Tripleseat's Sites API and map them to our form
 * options. IDs are account-managed in Tripleseat — not configurable by admins.
 */
export async function resolveReferralSources(
  tripleseat: TripleseatConfig,
  locationName: string,
): Promise<ReferralSourceMapping> {
  if (!tripleseat.publicKey) return DEFAULT_MAPPING;

  const apiBase = tripleseat.apiBaseUrl || "https://api.tripleseat.com/v1";
  const cacheKey = `${apiBase}:${tripleseat.publicKey}:${tripleseat.locationId ?? ""}:${locationName}`;

  let pending = cache.get(cacheKey);
  if (!pending) {
    pending = fetchMapping(apiBase, tripleseat.publicKey, tripleseat.locationId, locationName);
    cache.set(cacheKey, pending);
  }
  return pending;
}

async function fetchMapping(
  apiBase: string,
  publicKey: string,
  locationId: number | undefined,
  locationName: string,
): Promise<ReferralSourceMapping> {
  try {
    const url = `${apiBase}/sites.json?public_key=${encodeURIComponent(publicKey)}`;
    const res = await fetch(url);
    if (!res.ok) return DEFAULT_MAPPING;

    const data: unknown = await res.json();
    const sites = parseSites(data);
    if (sites.length === 0) return DEFAULT_MAPPING;

    const site = findSite(sites, locationId, locationName) ?? sites[0]!;
    return mapReferralSources(site.referral_sources ?? []);
  } catch {
    return DEFAULT_MAPPING;
  }
}

function parseSites(data: unknown): TripleseatSite[] {
  const rows = Array.isArray(data) ? data : Object.values(data as Record<string, unknown>);
  return rows
    .map((row) => {
      if (row && typeof row === "object" && "site" in row) {
        return (row as { site: TripleseatSite }).site;
      }
      return row as TripleseatSite;
    })
    .filter((s) => s && typeof s.id === "number");
}

function findSite(
  sites: TripleseatSite[],
  locationId: number | undefined,
  locationName: string,
): TripleseatSite | undefined {
  if (locationId) {
    const byLocation = sites.find((site) =>
      site.billings?.some((billing) =>
        billing.billing_locations?.some((loc) => loc.location_id === locationId),
      ),
    );
    if (byLocation) return byLocation;
  }

  const target = normalize(locationName);
  return sites.find((site) => {
    const name = normalize(site.name);
    return name === target || name.includes(target) || target.includes(name);
  });
}

function mapReferralSources(sources: TripleseatReferralSource[]): ReferralSourceMapping {
  const referralSourceIds: Partial<Record<ReferralSource, number>> = {};

  for (const source of sources) {
    const label = matchLabel(source.name);
    if (label && referralSourceIds[label] === undefined) {
      referralSourceIds[label] = source.id;
    }
  }

  const otherId =
    sources.find((s) => normalize(s.name) === "other")?.id ??
    referralSourceIds.other ??
    DEFAULT_MAPPING.referralOtherSourceId;

  referralSourceIds.other ??= otherId;
  // No native Blog/Press in Tripleseat — submit as "Other" with descriptive text.
  referralSourceIds.blog ??= otherId;

  return {
    referralSourceIds: { ...DEFAULT_MAPPING.referralSourceIds, ...referralSourceIds },
    referralOtherSourceId: otherId,
  };
}

function matchLabel(tripleseatName: string): ReferralSource | null {
  const normalized = normalize(tripleseatName);
  for (const [label, needles] of Object.entries(LABEL_MATCHERS) as [ReferralSource, string[]][]) {
    if (needles.some((needle) => normalized.includes(needle))) return label;
  }
  return null;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
