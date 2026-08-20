import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

/**
 * After an invite/reset email lands on /admin?code=…, or when a pending
 * invitee still has a session, route to signup or set-password.
 */
export default function AuthEmailRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, session, profile, passwordSetup } = useAuth();

  useEffect(() => {
    if (loading || !session) return;

    const needsPassword =
      Boolean(passwordSetup) || (profile != null && !profile.onboarding_complete);
    if (!needsPassword) return;

    const target = passwordSetup?.isRecovery ? "/set-password" : "/signup";
    if (location.pathname === target) return;
    if (location.pathname === "/signup" || location.pathname === "/set-password") {
      return;
    }

    navigate(target, { replace: true });
  }, [loading, session, profile, passwordSetup, location.pathname, navigate]);

  return null;
}
