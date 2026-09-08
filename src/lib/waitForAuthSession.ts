import type { Session, SupabaseClient } from "@supabase/supabase-js";

/**
 * Wait for the current auth session without treating a stalled getSession() as
 * signed-out.
 *
 * Returns:
 * - `Session` when signed in
 * - `null` when auth has confirmed there is no session (INITIAL_SESSION)
 * - `undefined` on timeout — callers must not write this as signed-out
 */
export function waitForAuthSession(
  client: SupabaseClient,
  ms: number,
): Promise<Session | null | undefined> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (value: Session | null | undefined) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
      resolve(value);
    };

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED"
      ) {
        finish(session);
      }
    });

    const timer = setTimeout(() => finish(undefined), ms);

    void client.auth.getSession().then(
      ({ data }) => {
        // A session is definitive. A null result is not — getSession can race
        // a SIGNED_IN that onAuthStateChange already delivered elsewhere.
        if (data.session) finish(data.session);
      },
      () => {
        // Listener or timeout decides; don't map a hung/failed getSession to null.
      },
    );
  });
}
