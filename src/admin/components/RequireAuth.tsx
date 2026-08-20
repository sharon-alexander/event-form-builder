import { Navigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loading, session, profile, passwordSetup } = useAuth();

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

  // Invite accepted but password never set — send them to create-password,
  // not login (they have no password to sign in with).
  if (profile && !profile.onboarding_complete) {
    return <Navigate to="/signup" replace />;
  }

  // Session exists but profile still loading after auth change.
  if (!profile) {
    return (
      <div className="px-6 py-24 text-center text-sm text-zinc-400">Loading…</div>
    );
  }

  return <>{children}</>;
}
