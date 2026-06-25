import { Navigate } from "react-router-dom";
import { isSuperAdmin, useAuth } from "../auth";

export default function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="px-6 py-24 text-center text-sm text-gray-400">Loading…</div>
    );
  }

  if (!isSuperAdmin(profile)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
