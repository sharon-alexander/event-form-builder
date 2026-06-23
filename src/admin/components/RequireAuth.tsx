import { Navigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <div className="px-6 py-24 text-center text-sm text-gray-400">Loading…</div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
