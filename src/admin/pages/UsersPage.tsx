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
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-gray-900">Users</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage admin access for {org?.name ?? "your group"}.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </p>
      )}

      <form
        onSubmit={handleInvite}
        className="mb-8 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <h2 className="text-sm font-medium text-gray-900">Invite a new admin</h2>
        <p className="mt-1 text-sm text-gray-500">
          They will receive an email to set their password.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="efb-label" htmlFor="invite-email">
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="efb-input"
            />
          </div>
          <div className="sm:w-40">
            <label className="efb-label" htmlFor="invite-role">
              Role
            </label>
            <select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as AdminRole)}
              className="efb-input"
            >
              <option value="editor">Editor</option>
              <option value="super_admin">Super admin</option>
            </select>
          </div>
          <button type="submit" disabled={inviting} className="efb-btn-primary sm:mb-0">
            {inviting ? "Sending…" : "Send invite"}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-gray-500">No users found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const isSelf = user.id === profile?.id;
                return (
                  <tr key={user.id}>
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {user.email ?? "—"}
                      {isSelf && (
                        <span className="ml-2 text-xs font-normal text-gray-400">(you)</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isSelf ? (
                        <span className="text-gray-600">{ROLE_LABELS[user.role]}</span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) =>
                            void handleRoleChange(user, e.target.value as AdminRole)
                          }
                          className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                        >
                          <option value="editor">Editor</option>
                          <option value="super_admin">Super admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isSelf ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleRemove(user)}
                          className="text-sm font-medium text-red-600 hover:text-red-700"
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
