import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthCallbackResult = {
  /** True when this page load successfully consumed an email-link auth code. */
  didAuthenticate: boolean;
  isRecovery: boolean;
  error: string | null;
};

/**
 * Snapshot of the original URL hash captured at module-load time — before
 * HashRouter replaces it. GoTrue's implicit flow puts auth tokens here
 * (#access_token=…&type=invite); by the time React effects run the hash
 * is already overwritten by the router.
 */
const _originalHash =
  typeof window !== "undefined" ? window.location.hash : "";

/** Idempotency guard: caches the in-flight/resolved result for the page load. */
let _pending: Promise<AuthCallbackResult> | null = null;

/**
 * Consume auth params from the email-link redirect. Handles three vectors:
 *   1. PKCE code in query string  (?code=…)
 *   2. OTP token in query string  (?token_hash=…&type=invite)
 *   3. Implicit-flow tokens in hash fragment (#access_token=…&type=invite)
 *
 * Idempotent: React StrictMode re-runs effects in dev, which would otherwise
 * double-consume a single-use auth code.
 */
export async function consumeAuthCallback(
  client: SupabaseClient,
): Promise<AuthCallbackResult> {
  if (_pending) return _pending;

  const params = new URLSearchParams(window.location.search);
  const hasQueryParams =
    params.has("code") ||
    params.has("token_hash") ||
    params.has("error_code") ||
    params.has("error_description");

  if (hasQueryParams) {
    cleanQueryParams();
    _pending = consumeQueryParams(client, params);
    return _pending;
  }

  // Fallback: GoTrue implicit flow puts tokens in the hash fragment.
  // Read from _originalHash (captured before HashRouter wiped it).
  if (_originalHash.length > 1 && !_originalHash.startsWith("#/")) {
    const hashParams = new URLSearchParams(_originalHash.slice(1));
    if (hashParams.has("access_token") || hashParams.has("error_description")) {
      _pending = consumeHashTokens(client, hashParams);
      return _pending;
    }
  }

  return { didAuthenticate: false, isRecovery: false, error: null };
}

// ── Query-param flow (PKCE ?code= or direct ?token_hash=) ────────────────

async function consumeQueryParams(
  client: SupabaseClient,
  params: URLSearchParams,
): Promise<AuthCallbackResult> {
  const errorCode = params.get("error_code");
  const errorDescription = params.get("error_description");
  if (errorCode || errorDescription) {
    const message =
      errorCode === "otp_expired"
        ? "This email link is invalid or has expired. Request a new invite or password reset."
        : (errorDescription ?? "Email link failed.").replace(/\+/g, " ");
    return { didAuthenticate: false, isRecovery: false, error: message };
  }

  const type = params.get("type");
  const tokenHash = params.get("token_hash");
  if (tokenHash && type) {
    const { error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "recovery" | "invite" | "magiclink" | "email",
    });
    if (error) {
      return { didAuthenticate: false, isRecovery: type === "recovery", error: error.message };
    }
    return { didAuthenticate: true, isRecovery: type === "recovery", error: null };
  }

  const code = params.get("code");
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[authCallback] code exchange failed:", error.message);
      return { didAuthenticate: false, isRecovery: false, error: error.message };
    }
    // PKCE codes don't carry a type. Recovery is detected via the
    // PASSWORD_RECOVERY event in AuthProvider's onAuthStateChange instead.
    return { didAuthenticate: true, isRecovery: false, error: null };
  }

  return { didAuthenticate: false, isRecovery: false, error: null };
}

// ── Hash-fragment flow (implicit #access_token=…&type=invite) ─────────────

async function consumeHashTokens(
  client: SupabaseClient,
  hashParams: URLSearchParams,
): Promise<AuthCallbackResult> {
  const errorDescription = hashParams.get("error_description");
  if (errorDescription) {
    const errorCode = hashParams.get("error_code");
    const message =
      errorCode === "otp_expired"
        ? "This email link is invalid or has expired. Request a new invite or password reset."
        : errorDescription.replace(/\+/g, " ");
    return { didAuthenticate: false, isRecovery: false, error: message };
  }

  const accessToken = hashParams.get("access_token");
  if (!accessToken) {
    return { didAuthenticate: false, isRecovery: false, error: null };
  }

  const refreshToken = hashParams.get("refresh_token") ?? "";
  const type = hashParams.get("type");

  const { error } = await client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    return { didAuthenticate: false, isRecovery: type === "recovery", error: error.message };
  }

  return {
    didAuthenticate: true,
    isRecovery: type === "recovery",
    error: null,
  };
}

// ── URL cleanup ───────────────────────────────────────────────────────────

function cleanQueryParams() {
  const url = new URL(window.location.href);
  let changed = false;
  for (const key of [
    "code",
    "token_hash",
    "type",
    "error",
    "error_code",
    "error_description",
  ]) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (changed) {
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }
}
