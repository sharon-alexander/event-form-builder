import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Whether Supabase env vars are present. The public form falls back to the
 *  bundled TypeScript configs when this is false. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/** Shared browser client, or `null` when Supabase isn't configured. */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    })
  : null;

/**
 * Auth-free client for the public form. Disabling session handling avoids the
 * supabase-js auth lock (navigator.locks) that can stall the very first DB
 * query on initial page load — the cause of the form getting stuck on
 * "Loading…" until a manual reload. The public form only reads published rows
 * via the anon key, so no session is ever needed.
 */
export const supabasePublic: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;

/** Returns the client or throws — use in the admin app where Supabase is required. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  return supabase;
}
