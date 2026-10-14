import { requireSupabase } from "../lib/supabase";
import type { LocationRow } from "../locations/fromDb";

const GALLERY_BUCKET = "gallery";

/** All locations visible to the current admin (RLS scopes this to their org). */
export async function listLocations(): Promise<LocationRow[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LocationRow[];
}

export async function getLocationById(id: string): Promise<LocationRow | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("id", id)
    .maybeSingle<LocationRow>();
  if (error) throw error;
  return data;
}

export type LocationUpdate = Partial<Omit<LocationRow, "id" | "org_id" | "created_at" | "updated_at">>;

export async function updateLocation(
  id: string,
  patch: LocationUpdate,
  signal?: AbortSignal,
): Promise<void> {
  const supabase = requireSupabase();
  let request = supabase.from("locations").update(patch).eq("id", id);
  if (signal) request = request.abortSignal(signal);
  const { error } = await request;
  if (signal?.aborted) return;
  if (error) throw error;
}

export async function createLocation(
  orgId: string,
  row: { slug: string; name: string } & LocationUpdate,
): Promise<LocationRow> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("locations")
    .insert({ org_id: orgId, ...row })
    .select()
    .single<LocationRow>();
  if (error) throw error;
  return data;
}

export async function deleteLocation(id: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) throw error;
}

/** Upload a gallery file and return its public URL. */
export async function uploadGalleryFile(
  orgId: string,
  slug: string,
  file: File,
): Promise<string> {
  const supabase = requireSupabase();
  const safeName = sanitizeFileName(file.name);
  const path = `org/${orgId}/${slug}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: true });
  if (error) throw error;
  return supabase.storage.from(GALLERY_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Upload a generated thumbnail next to gallery originals. */
export async function uploadGalleryBlob(
  orgId: string,
  slug: string,
  blob: Blob,
  fileName: string,
  contentType: string,
): Promise<string> {
  const supabase = requireSupabase();
  const safeName = sanitizeFileName(fileName);
  const path = `org/${orgId}/${slug}/thumbs/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(GALLERY_BUCKET).upload(path, blob, {
    contentType,
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(GALLERY_BUCKET).getPublicUrl(path).data.publicUrl;
}

const GALLERY_PUBLIC_MARKER = "/object/public/gallery/";

/** Storage path for a public gallery URL, or null when the URL is not in this bucket. */
export function galleryObjectPath(url: string): string | null {
  const index = url.indexOf(GALLERY_PUBLIC_MARKER);
  if (index === -1) return null;
  const path = url.slice(index + GALLERY_PUBLIC_MARKER.length).split("?")[0] ?? "";
  if (!path) return null;
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/** Delete gallery objects. URLs outside the bucket are ignored. */
export async function deleteGalleryFiles(urls: Array<string | null | undefined>): Promise<void> {
  const paths = [
    ...new Set(
      urls.flatMap((url) => {
        if (!url) return [];
        const path = galleryObjectPath(url);
        return path ? [path] : [];
      }),
    ),
  ];
  if (paths.length === 0) return;
  const supabase = requireSupabase();
  const { error } = await supabase.storage.from(GALLERY_BUCKET).remove(paths);
  if (error) throw error;
}

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
