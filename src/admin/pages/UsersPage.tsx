import { useCallback, useEffect, useState } from "react";
import type { AdminRole } from "../auth";
import { useAuth } from "../auth";
import {
  inviteOrgUser,
  listOrgUsers,
  removeOrgUser,
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
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((user) => {
                const isSelf = user.id === profile?.id;
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
                    <td className="px-5 py-4 text-zinc-500">{formatDate(user.created_at)}</td>
                    <td className="px-5 py-4 text-right">
                      {isSelf ? (
                        <span className="text-xs text-zinc-400">—</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleRemove(user)}
                          className="text-sm font-medium text-red-600 transition-colors hover:text-red-700"
                        >
                          Remove
                        </button>
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
