import { Link, Outlet, useLocation } from "react-router-dom";
import { isSuperAdmin, useAuth } from "../auth";

export default function AdminLayout() {
  const { org, profile, signOut } = useAuth();
  const location = useLocation();

  const nav = [
    {
      to: "/",
      label: "Forms",
      active: location.pathname === "/" || location.pathname.startsWith("/forms"),
      icon: FormsIcon,
      show: true,
    },
    {
      to: "/users",
      label: "Users",
      active: location.pathname === "/users",
      icon: UsersIcon,
      show: isSuperAdmin(profile),
    },
  ].filter((item) => item.show);

  const orgInitials = (org?.name ?? "EF")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-zinc-200 bg-white lg:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-sm font-semibold text-white">
            {orgInitials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-zinc-900">
              {org?.name ?? "Event Forms"}
            </p>
            <p className="text-xs text-zinc-400">Event Forms</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {nav.map((item) => (
            <SidebarLink key={item.to} to={item.to} active={item.active} icon={item.icon}>
              {item.label}
            </SidebarLink>
          ))}
        </nav>

        <div className="border-t border-zinc-100 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
              {(profile?.email ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <p className="min-w-0 flex-1 truncate text-xs text-zinc-500" title={profile?.email ?? ""}>
              {profile?.email ?? "Signed in"}
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <SignOutIcon className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-xs font-semibold text-white">
            {orgInitials}
          </div>
          <span className="text-sm font-semibold text-zinc-900">{org?.name ?? "Event Forms"}</span>
        </div>
        <nav className="flex items-center gap-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                item.active ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={signOut}
            className="ml-1 rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-100"
            aria-label="Sign out"
          >
            <SignOutIcon className="h-4 w-4" />
          </button>
        </nav>
      </header>

      {/* Main content */}
      <div className="flex-1 lg:pl-64">
        <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:py-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarLink({
  to,
  active,
  icon: Icon,
  children,
}: {
  to: string;
  active: boolean;
  icon: (props: { className?: string }) => JSX.Element;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}

function FormsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path strokeLinecap="round" d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="9" cy="8" r="3.2" />
      <path strokeLinecap="round" d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path strokeLinecap="round" d="M16 5.2A3 3 0 0119 8m1.5 11c0-2.4-1.4-4.2-3.5-4.8" />
    </svg>
  );
}

function SignOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H4m0 0l4-4m-4 4l4 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V5a2 2 0 012-2h7a2 2 0 012 2v14a2 2 0 01-2 2h-7a2 2 0 01-2-2v-2" />
    </svg>
  );
}
