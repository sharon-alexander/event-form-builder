import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminRole } from "../auth";
import { useAuth } from "../auth";
import {
  inviteOrgUser,
  listOrgUsers,
  removeOrgUser,
  resendOrgInvite,
  updateOrgUserRole,
  type OrgUser,
} from "../usersApi";

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super admin",
  editor: "Editor",
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900";

export default function UsersPage() {
  const { org, profile } = useAuth();
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("editor");
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await listOrgUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError(null);
    setSuccess(null);
    try {
      const trimmed = inviteEmail.trim();
      await inviteOrgUser(trimmed, inviteRole);
      setInviteEmail("");
      setInviteRole("editor");
      setSuccess(`Invite sent to ${trimmed}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite.");
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(user: OrgUser, role: AdminRole) {
    if (user.role === role) return;
    setError(null);
    setSuccess(null);
    try {
      await updateOrgUserRole(user.id, role);
      setSuccess(`Updated role for ${user.email ?? "user"}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role.");
    }
  }

  async function handleResendInvite(user: OrgUser) {
    setError(null);
    setSuccess(null);
    try {
      await resendOrgInvite(user.id);
      setSuccess(`Invite resent to ${user.email ?? "user"}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend invite.");
    }
  }

  async function handleRemove(user: OrgUser) {
    if (!window.confirm(`Remove ${user.email ?? "this user"} from ${org?.name ?? "your organization"}?`)) {
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await removeOrgUser(user.id);
      setSuccess(`Removed ${user.email ?? "user"}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove user.");
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Users</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage admin access for {org?.name ?? "your group"}.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      )}

      <form
        onSubmit={handleInvite}
        className="mb-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-zinc-900">Invite a new admin</h2>
        <p className="mt-1 text-sm text-zinc-500">
          They will receive an email to set their password.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-zinc-700" htmlFor="invite-email">
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className={inputClass}
            />
          </div>
          <div className="sm:w-44">
            <label className="mb-1.5 block text-sm font-medium text-zinc-700" htmlFor="invite-role">
              Role
            </label>
            <select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as AdminRole)}
              className={inputClass}
            >
              <option value="editor">Editor</option>
              <option value="super_admin">Super admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {inviting ? "Sending…" : "Send invite"}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl border border-zinc-200 bg-white" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <p className="text-sm text-zinc-500">No users found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="rounded-tl-xl px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Joined</th>
                <th className="w-12 rounded-tr-xl px-3 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((user) => {
                const isSelf = user.id === profile?.id;
                const pending = !user.onboarding_complete;
                return (
                  <tr key={user.id} className="transition-colors hover:bg-zinc-50/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                          {(user.email ?? "?").slice(0, 1).toUpperCase()}
                        </div>
                        <span className="font-medium text-zinc-900">
                          {user.email ?? "—"}
                          {isSelf && (
                            <span className="ml-2 text-xs font-normal text-zinc-400">(you)</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {isSelf ? (
                        <span className="text-zinc-600">{ROLE_LABELS[user.role]}</span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => void handleRoleChange(user, e.target.value as AdminRole)}
                          className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-700 transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        >
                          <option value="editor">Editor</option>
                          <option value="super_admin">Super admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-4 text-zinc-500">
                      {pending ? (
                        <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Pending
                        </span>
                      ) : (
                        formatDate(user.joined_at ?? user.created_at)
                      )}
                    </td>
                    <td className="px-3 py-4 text-right">
                      {!isSelf && (
                        <UserRowMenu
                          pending={pending}
                          onResendInvite={() => void handleResendInvite(user)}
                          onDelete={() => void handleRemove(user)}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UserRowMenu({
  pending,
  onResendInvite,
  onDelete,
}: {
  pending: boolean;
  onResendInvite: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
        aria-label="Actions"
        aria-expanded={open}
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="10" cy="16" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 bottom-full z-50 mb-1 w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg ring-1 ring-black/5">
          {pending && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onResendInvite();
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Resend invite
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0v12a1 1 0 001 1h6a1 1 0 001-1V7" />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
