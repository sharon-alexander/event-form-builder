import { Link, Outlet, useLocation } from "react-router-dom";
import { isSuperAdmin, useAuth } from "../auth";

export default function AdminLayout() {
  const { org, profile, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3">
              <span className="font-display text-lg font-semibold">Event Forms</span>
              {org && (
                <span className="rounded-full bg-brand-50 px-3 py-0.5 text-xs font-medium text-brand-700">
                  {org.name}
                </span>
              )}
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <NavLink to="/" active={location.pathname === "/"}>
                Forms
              </NavLink>
              {isSuperAdmin(profile) && (
                <NavLink to="/users" active={location.pathname === "/users"}>
                  Users
                </NavLink>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {profile?.email && (
              <span className="hidden text-gray-500 sm:inline">{profile.email}</span>
            )}
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-gray-700 transition-colors hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`font-medium transition-colors ${
        active ? "text-brand-700" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </Link>
  );
}
