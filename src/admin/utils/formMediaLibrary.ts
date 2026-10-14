import type { MediaItem, VenueSpaceOption } from "../../locations/types";
import type { LibraryMedia } from "../mediaLibraryApi";

export function libraryItemToMedia(item: LibraryMedia): MediaItem {
  return {
    type: item.type,
    src: item.src,
    alt: item.alt,
    ...(item.thumb ? { thumb: item.thumb } : {}),
    ...(item.poster ? { poster: item.poster } : {}),
    ...(item.provider ? { provider: item.provider } : {}),
  };
}

/** Where a library item is currently shown. Empty means it can be deleted. */
export function mediaUsages(
  draft: { gallery_media: MediaItem[]; venue_spaces: VenueSpaceOption[] },
  src: string,
): string[] {
  const labels: string[] = [];
  if (draft.gallery_media.some((item) => item.src === src)) labels.push("Landing");
  for (const venue of draft.venue_spaces) {
    if ((venue.galleryMedia ?? []).some((item) => item.src === src)) {
      labels.push(venue.label.trim() || "Untitled space");
    }
  }
  return labels;
}

/** Usages across the dirty draft and the last saved form. Either one blocks delete. */
export function placementUsages(
  placements: Array<{ gallery_media: MediaItem[]; venue_spaces: VenueSpaceOption[] }>,
  src: string,
): string[] {
  const labels: string[] = [];
  for (const placement of placements) {
    for (const label of mediaUsages(placement, src)) {
      if (!labels.includes(label)) labels.push(label);
    }
  }
  return labels;
}

/** Append items whose src is not already present. */
export function appendUnique(current: MediaItem[], incoming: MediaItem[]): MediaItem[] {
  const seen = new Set(current.map((item) => item.src));
  const next = [...current];
  for (const item of incoming) {
    if (seen.has(item.src)) continue;
    seen.add(item.src);
    next.push(item);
  }
  return next;
}
