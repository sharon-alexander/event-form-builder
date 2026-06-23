import type { LocationConfig } from "./types";
import pearlBox from "./pearl-box";
import roscioli from "./roscioli";
import tokyoRecordBar from "./tokyo-record-bar";

export type { LocationConfig } from "./types";
export type {
  MediaItem,
  VenueSpaceOption,
  BudgetOption,
  TripleseatConfig,
} from "./types";

const LOCATIONS: Record<string, LocationConfig> = {
  "pearl-box": pearlBox,
  roscioli,
  "tokyo-record-bar": tokyoRecordBar,
};

export const DEFAULT_LOCATION_ID = "pearl-box";

export function getLocation(id: string | null | undefined): LocationConfig {
  if (id && id in LOCATIONS) return LOCATIONS[id]!;
  return LOCATIONS[DEFAULT_LOCATION_ID]!;
}

/** Like getLocation but returns null when the slug isn't a bundled location. */
export function tryGetLocation(
  id: string | null | undefined,
): LocationConfig | null {
  if (id && id in LOCATIONS) return LOCATIONS[id]!;
  return null;
}

export function getAllLocations(): LocationConfig[] {
  return Object.values(LOCATIONS);
}

export function getLocationIds(): string[] {
  return Object.keys(LOCATIONS);
}
