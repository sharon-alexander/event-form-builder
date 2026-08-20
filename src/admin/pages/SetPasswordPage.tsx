import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requireSupabase } from "../../lib/supabase";
import { useAuth } from "../auth";

export default function SetPasswordPage() {
  const navigate = useNavigate();
  const {
    loading,
    session,
    passwordSetup,
    clearPasswordSetup,
    refreshProfile,
    abandonPasswordSetup,
  } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  // Recovery email → reset copy. Invite (or pending joined_at) → signup copy.
  const isRecovery = passwordSetup?.isRecovery === true;

  useEffect(() => {
    if (loading) return;

    if (session) {
      setReady(true);
      setError(null);
      setChecking(false);
      return;
    }

    setReady(false);
    setChecking(false);
    setError(
      isRecovery
        ? "This reset link is invalid or has expired. Request a new password reset."
        : "This invite link is invalid or has expired. Ask your administrator to resend it.",
    );
  }, [loading, session, isRecovery]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = requireSupabase();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      const { error: acceptError } = await supabase.rpc("accept_admin_invite");
      if (acceptError) throw acceptError;
      clearPasswordSetup();
      await refreshProfile();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBackToSignIn() {
    await abandonPasswordSetup();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 font-sans">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {isRecovery ? "Reset your password" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isRecovery
              ? "Choose a new password for your admin account."
              : "Choose a password to finish joining Event Forms Admin."}
          </p>
        </div>

        {checking || loading ? (
          <p className="text-center text-sm text-zinc-400">
            {isRecovery ? "Verifying reset link…" : "Verifying invite…"}
          </p>
        ) : !ready ? (
          <div className="space-y-4">
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void handleBackToSignIn()}
              className="block w-full text-center text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <div>
              <label className="adm-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="adm-input"
              />
            </div>
            <div>
              <label className="adm-label" htmlFor="confirm">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="adm-input"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="adm-btn-primary w-full"
            >
              {submitting
                ? "Saving…"
                : isRecovery
                  ? "Update password"
                  : "Create account"}
            </button>

            <button
              type="button"
              onClick={() => void handleBackToSignIn()}
              className="w-full text-center text-sm font-medium text-zinc-500 hover:text-zinc-800"
            >
              Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
