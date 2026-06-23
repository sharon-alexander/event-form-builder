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

export interface Profile {
  id: string;
  org_id: string;
  role: string;
  email: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface AuthState {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  org: Organization | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);

  const loadProfile = useCallback(async (uid: string) => {
    if (!supabase) return;
    const { data: prof } = await supabase
      .from("profiles")
      .select("id, org_id, role, email")
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

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
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

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
    setOrg(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ loading, session, profile, org, signIn, signOut }),
    [loading, session, profile, org, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
