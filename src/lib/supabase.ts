import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Whether Supabase env vars are present. The public form falls back to the
 *  bundled TypeScript configs when this is false. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Auth-free client for the public form.
 *
 * `accessToken` makes REST calls use the anon key directly and skips
 * `auth.getSession()`. That avoids creating a second GoTrue client (same
 * default storage key as the admin client) whose initialize/token-refresh
 * can stall the first DB query — the form then sits on "Loading…" until a
 * manual reload.
 */
export const supabasePublic: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      accessToken: async () => anonKey!,
      db: { timeout: 8000 },
    })
  : null;

let authClient: SupabaseClient | null | undefined;

/**
 * Session-aware client used by admin and unpublished-form preview.
 * Lazy so the public form never starts auth recovery/token refresh.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (authClient === undefined) {
    authClient = createClient(url!, anonKey!, {
      auth: {
        // AuthProvider calls exchangeCodeForSession / verifyOtp explicitly so
        // we don't race a second automatic exchange (which burns the one-time code).
        detectSessionInUrl: false,
        flowType: "pkce",
      },
      db: { timeout: 8000 },
    });
  }
  return authClient;
}

/** Returns the client or throws — use in the admin app where Supabase is required. */
export function requireSupabase(): SupabaseClient {
  const client = getSupabase();
  if (!client) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  return client;
}
