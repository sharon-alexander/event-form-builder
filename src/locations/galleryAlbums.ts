import type { GalleryAlbum, MediaItem } from "./types";

export function createGalleryAlbum(): GalleryAlbum {
  return {
    id: crypto.randomUUID(),
    title: "",
    media: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMediaItem(value: unknown): value is MediaItem {
  if (!isRecord(value) || typeof value.src !== "string" || value.src.length === 0) return false;
  return value.type === "image" || value.type === "video" || value.type === "embed";
}

function isAlbum(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && Array.isArray(value.media);
}

function normalizeAlbum(value: Record<string, unknown>): GalleryAlbum {
  const media = Array.isArray(value.media) ? value.media.filter(isMediaItem) : [];
  return {
    id: typeof value.id === "string" && value.id ? value.id : crypto.randomUUID(),
    title: typeof value.title === "string" ? value.title : "",
    media,
  };
}

/**
 * `locations.gallery_media` stores folders. Older rows stored a flat media list;
 * those become one folder so existing photos stay on the landing page.
 */
export function parseGalleryAlbums(value: unknown): GalleryAlbum[] {
  if (!Array.isArray(value) || value.length === 0) return [];
  if (isAlbum(value[0])) return value.filter(isAlbum).map(normalizeAlbum);
  const media = value.filter(isMediaItem);
  if (media.length === 0) return [];
  return [{ id: crypto.randomUUID(), title: "", media }];
}
