import type { MediaItem } from "../../locations/types";
import type { EditableLocation } from "../pages/FormEditorPage";

/** All unique media already used on this form (landing gallery + venue galleries). */
export function collectFormMedia(draft: EditableLocation): MediaItem[] {
  const seen = new Set<string>();
  const items: MediaItem[] = [];

  function add(item: MediaItem) {
    if (seen.has(item.src)) return;
    seen.add(item.src);
    items.push(item);
  }

  for (const item of draft.gallery_media) add(item);
  for (const venue of draft.venue_spaces) {
    for (const item of venue.galleryMedia ?? []) add(item);
  }

  return items;
}
