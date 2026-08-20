import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loading, session, profile, passwordSetup, signOut } = useAuth();

  // Pending invitee who typed the URL (not from email link) — can't use app.
  // Sign them out so they land on login.
  useEffect(() => {
    if (loading || !session || !profile) return;
    if (passwordSetup) return;
    if (!profile.onboarding_complete) {
      void signOut();
    }
  }, [loading, session, profile, passwordSetup, signOut]);

  if (loading) {
    return (
      <div className="px-6 py-24 text-center text-sm text-zinc-400">Loading…</div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Email-link handoff for this page load → signup or reset.
  if (passwordSetup) {
    return (
      <Navigate
        to={passwordSetup.isRecovery ? "/set-password" : "/signup"}
        replace
      />
    );
  }

  // Pending user being signed out above — will redirect to login next render.
  if (profile && !profile.onboarding_complete) {
    return <Navigate to="/login" replace />;
  }

  // Session exists but profile still loading after auth change.
  if (!profile) {
    return (
      <div className="px-6 py-24 text-center text-sm text-zinc-400">Loading…</div>
    );
  }

  return <>{children}</>;
}
