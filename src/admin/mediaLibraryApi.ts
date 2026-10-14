import type { MediaEmbedProvider, MediaItem } from "../locations/types";
import {
  deleteGalleryFiles,
  uploadGalleryBlob,
  uploadGalleryFile,
} from "./api";
import { createImageThumb } from "./imageThumb";
import { requireSupabase } from "../lib/supabase";

export const MEDIA_PAGE_SIZE = 48;

const COLUMNS = "id, type, src, thumb, poster, alt, provider";

export interface LibraryMedia extends MediaItem {
  id: string;
}

type LocationMediaRow = {
  id: string;
  type: string;
  src: string;
  thumb: string | null;
  poster: string | null;
  alt: string | null;
  provider: string | null;
};

export class UploadError extends Error {
  saved: LibraryMedia[];

  constructor(message: string, saved: LibraryMedia[]) {
    super(message);
    this.name = "UploadError";
    this.saved = saved;
  }
}

export function savedFromUploadError(err: unknown): LibraryMedia[] {
  return err instanceof UploadError ? err.saved : [];
}

function toLibraryMedia(row: LocationMediaRow): LibraryMedia {
  const type = row.type === "video" || row.type === "embed" ? row.type : "image";
  const provider: MediaEmbedProvider | undefined = row.provider === "vimeo" ? "vimeo" : undefined;
  return {
    id: row.id,
    type,
    src: row.src,
    alt: row.alt ?? "",
    ...(row.thumb ? { thumb: row.thumb } : {}),
    ...(row.poster ? { poster: row.poster } : {}),
    ...(provider ? { provider } : {}),
  };
}

export async function listLocationMedia(locationId: string, offset: number): Promise<LibraryMedia[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("location_media")
    .select(COLUMNS)
    .eq("location_id", locationId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + MEDIA_PAGE_SIZE - 1);
  if (error) throw error;
  return ((data ?? []) as LocationMediaRow[]).map(toLibraryMedia);
}

export async function insertLocationMedia(
  locationId: string,
  item: MediaItem,
): Promise<LibraryMedia> {
  const supabase = requireSupabase();
  const row = {
    location_id: locationId,
    type: item.type,
    src: item.src,
    thumb: item.thumb ?? null,
    poster: item.poster ?? null,
    alt: item.alt,
    provider: item.provider ?? null,
  };
  const { data, error } = await supabase
    .from("location_media")
    .insert(row)
    .select(COLUMNS)
    .maybeSingle<LocationMediaRow>();
  if (!error && data) return toLibraryMedia(data);
  if (error && error.code !== "23505") throw error;

  const existing = await supabase
    .from("location_media")
    .select(COLUMNS)
    .eq("location_id", locationId)
    .eq("src", item.src)
    .maybeSingle<LocationMediaRow>();
  if (existing.error) throw existing.error;
  if (!existing.data) throw error ?? new Error("Could not save media.");
  return toLibraryMedia(existing.data);
}

export async function deleteLocationMedia(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const supabase = requireSupabase();
  const { error } = await supabase.from("location_media").delete().in("id", ids);
  if (error) throw error;
}

async function uploadOne(
  orgId: string,
  slug: string,
  locationId: string,
  file: File,
): Promise<LibraryMedia> {
  const original = await uploadGalleryFile(orgId, slug, file);
  let thumb: string | undefined;
  if (file.type.startsWith("image/")) {
    try {
      const blob = await createImageThumb(file);
      if (blob) {
        const ext = blob.type === "image/webp" ? "webp" : "jpg";
        thumb = await uploadGalleryBlob(
          orgId,
          slug,
          blob,
          `${crypto.randomUUID()}.${ext}`,
          blob.type,
        );
      }
    } catch {
      thumb = undefined;
    }
  }
  const item: MediaItem = {
    type: file.type.startsWith("video/") ? "video" : "image",
    src: original,
    alt: file.name.replace(/\.[^.]+$/, ""),
    ...(thumb ? { thumb } : {}),
  };
  try {
    return await insertLocationMedia(locationId, item);
  } catch (err) {
    await deleteGalleryFiles([original, thumb]).catch(() => undefined);
    throw err;
  }
}

/** Upload files into the form library. Files saved before a failure are on `UploadError.saved`. */
export async function uploadToLibrary(
  orgId: string,
  slug: string,
  locationId: string,
  files: File[],
): Promise<LibraryMedia[]> {
  const saved: LibraryMedia[] = [];
  try {
    for (const file of files) {
      saved.push(await uploadOne(orgId, slug, locationId, file));
    }
    return saved;
  } catch (err) {
    if (saved.length === 0) throw err;
    const message = err instanceof Error ? err.message : "Upload failed.";
    const count = `${saved.length} file${saved.length === 1 ? "" : "s"}`;
    throw new UploadError(`${message} ${count} uploaded before the failure.`, saved);
  }
}
