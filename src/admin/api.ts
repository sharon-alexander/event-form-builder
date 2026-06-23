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

export async function updateLocation(id: string, patch: LocationUpdate): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from("locations").update(patch).eq("id", id);
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

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
