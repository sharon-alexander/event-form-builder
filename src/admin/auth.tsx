import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { consumeAuthCallback } from "./authCallback";

export type AdminRole = "super_admin" | "editor";

export interface Profile {
  id: string;
  org_id: string;
  role: AdminRole;
  email: string | null;
  /** Null until the invitee finishes set-password (or seed/backfill). */
  joined_at: string | null;
  onboarding_complete: boolean;
}

export function isSuperAdmin(profile: Profile | null | undefined): boolean {
  return profile?.role === "super_admin";
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

/**
 * Redirect target for invite + password-reset emails.
 * Must NOT include a hash — Supabase PKCE appends ?code=… and a #/route
 * in redirectTo breaks the exchange (otp_expired → bounced to Site URL).
 * The app then routes to #/set-password after detecting the session.
 */
export function adminSetPasswordUrl(): string {
  return `${window.location.origin}/admin`;
}

/** In-memory only — never persist. Survives for this tab session's email handoff. */
export type PasswordSetup = {
  isRecovery: boolean;
};

interface AuthState {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  org: Organization | null;
  /** Set only after this page load consumed an invite/reset email link. */
  passwordSetup: PasswordSetup | null;
  clearPasswordSetup: () => void;
  refreshProfile: () => Promise<void>;
  /** Sign out and drop password-setup state so the user can return to login. */
  abandonPasswordSetup: () => Promise<void>;
  /** Set when the email-link callback failed (shown on login). */
  authCallbackError: string | null;
  clearAuthCallbackError: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [passwordSetup, setPasswordSetup] = useState<PasswordSetup | null>(null);
  const [authCallbackError, setAuthCallbackError] = useState<string | null>(null);

  const loadProfile = useCallback(async (uid: string) => {
    if (!supabase) return;
    const { data: prof } = await supabase
      .from("profiles")
      .select("id, org_id, role, email, joined_at, onboarding_complete")
      .eq("id", uid)
      .maybeSingle<Profile>();
    setProfile(prof ?? null);

    if (prof?.org_id) {
      const { data: organization } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .eq("id", prof.org_id)
        .maybeSingle<Organization>();
      setOrg(organization ?? null);
    } else {
      setOrg(null);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    const client = supabase;

    async function init() {
      // Drop legacy redirect flags from earlier builds (caused set-password loops).
      sessionStorage.removeItem("efb_needs_password");
      sessionStorage.removeItem("efb_password_recovery");

      const callback = await consumeAuthCallback(client);
      if (!active) return;
      if (callback.error) setAuthCallbackError(callback.error);
      if (callback.didAuthenticate) {
        // Functional update: the PASSWORD_RECOVERY auth event may have
        // already set isRecovery=true before this line runs. Don't
        // overwrite the more specific value with the code path's false.
        setPasswordSetup((prev) =>
          prev?.isRecovery ? prev : { isRecovery: callback.isRecovery },
        );
      }

      const { data } = await client.auth.getSession();
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      if (active) setLoading(false);
    }

    void init();

    const { data: sub } = client.auth.onAuthStateChange(async (event, next) => {
      if (event === "PASSWORD_RECOVERY") {
        setPasswordSetup({ isRecovery: true });
      }
      setSession(next);
      if (next?.user) {
        await loadProfile(next.user.id);
      } else {
        setProfile(null);
        setOrg(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const clearAuthCallbackError = useCallback(() => setAuthCallbackError(null), []);
  const clearPasswordSetup = useCallback(() => setPasswordSetup(null), []);

  const refreshProfile = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) await loadProfile(data.session.user.id);
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: adminSetPasswordUrl(),
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
    setOrg(null);
    setPasswordSetup(null);
  }, []);

  const abandonPasswordSetup = useCallback(async () => {
    setPasswordSetup(null);
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
    setOrg(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      session,
      profile,
      org,
      passwordSetup,
      clearPasswordSetup,
      refreshProfile,
      abandonPasswordSetup,
      authCallbackError,
      clearAuthCallbackError,
      signIn,
      resetPassword,
      signOut,
    }),
    [
      loading,
      session,
      profile,
      org,
      passwordSetup,
      clearPasswordSetup,
      refreshProfile,
      abandonPasswordSetup,
      authCallbackError,
      clearAuthCallbackError,
      signIn,
      resetPassword,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
