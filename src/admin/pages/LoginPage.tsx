import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

type Mode = "login" | "forgot";

export default function LoginPage() {
  const {
    session,
    loading,
    profile,
    passwordSetup,
    authCallbackError,
    clearAuthCallbackError,
    signIn,
    resetPassword,
  } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !session) return;
    if (passwordSetup) {
      navigate(passwordSetup.isRecovery ? "/set-password" : "/signup", { replace: true });
      return;
    }
    if (profile && !profile.onboarding_complete) {
      // Pending user — only route to signup from email link (handled by passwordSetup above).
      // If they're on login page with no passwordSetup, they just stay here.
      return;
    }
    if (profile) navigate("/", { replace: true });
  }, [loading, session, profile, passwordSetup, navigate]);

  useEffect(() => {
    if (!authCallbackError) return;
    setError(authCallbackError);
    clearAuthCallbackError();
  }, [authCallbackError, clearAuthCallbackError]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSuccess(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await signIn(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await resetPassword(email.trim());
      setSuccess(
        "If an account exists for that email, we sent a link to reset your password.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reset email.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 font-sans">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Event Forms Admin
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {mode === "login"
              ? "Sign in to manage your forms"
              : "We'll email you a password reset link"}
          </p>
        </div>

        {mode === "login" ? (
          <form
            onSubmit={handleLogin}
            className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <div>
              <label className="adm-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="adm-input"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="adm-label !mb-0" htmlFor="password">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleForgot}
            className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <div>
              <label className="adm-label" htmlFor="reset-email">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="adm-input"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="adm-btn-primary w-full"
            >
              {submitting ? "Sending…" : "Send reset link"}
            </button>

            <button
              type="button"
              onClick={() => switchMode("login")}
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
