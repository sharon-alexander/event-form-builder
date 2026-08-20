import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

/**
 * After an invite/reset email lands on /admin?code=…, route to signup or
 * set-password. In-memory passwordSetup only — never on a normal / visit.
 */
export default function AuthEmailRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, session, passwordSetup } = useAuth();

  useEffect(() => {
    if (loading || !session || !passwordSetup) return;

    const target = passwordSetup.isRecovery ? "/set-password" : "/signup";
    if (location.pathname === target) return;
    if (location.pathname === "/signup" || location.pathname === "/set-password") {
      return;
    }

    navigate(target, { replace: true });
  }, [loading, session, passwordSetup, location.pathname, navigate]);

  return null;
}
