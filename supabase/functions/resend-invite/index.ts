import {
  corsPreflightResponse,
  jsonResponse,
  requireSuperAdmin,
} from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflightResponse();
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const auth = await requireSuperAdmin(req);
  if (auth instanceof Response) return auth;

  const { profile, serviceClient } = auth;

  let body: { userId?: string; redirectTo?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  const targetId = body.userId?.trim();
  if (!targetId) {
    return jsonResponse({ error: "userId is required." }, 400);
  }

  const { data: target, error: targetError } = await serviceClient
    .from("profiles")
    .select("id, org_id, email, role, joined_at, onboarding_complete")
    .eq("id", targetId)
    .maybeSingle();

  if (targetError || !target) {
    return jsonResponse({ error: "User not found." }, 404);
  }

  if (target.org_id !== profile.org_id) {
    return jsonResponse({ error: "User is not in your organization." }, 403);
  }

  if (target.onboarding_complete) {
    return jsonResponse(
      { error: "This user has already joined. They can use Forgot password instead." },
      400,
    );
  }

  if (!target.email) {
    return jsonResponse({ error: "User has no email address." }, 400);
  }

  const redirectTo = body.redirectTo || Deno.env.get("ADMIN_SET_PASSWORD_URL");
  if (!redirectTo) {
    return jsonResponse({ error: "ADMIN_SET_PASSWORD_URL is not configured." }, 500);
  }

  // auth.resend({ type: "invite" }) is unreliable for existing users, and
  // resetPasswordForEmail sends the wrong template. Delete + re-invite so
  // Supabase sends the real "Invite user" email again.
  const email = target.email;
  const role = target.role;
  const orgId = target.org_id;

  const { error: deleteError } = await serviceClient.auth.admin.deleteUser(targetId);
  if (deleteError) {
    return jsonResponse({ error: deleteError.message }, 500);
  }
  // profiles.id references auth.users ON DELETE CASCADE — row is gone.

  const { data: inviteData, error: inviteError } =
    await serviceClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { org_id: orgId },
    });

  if (inviteError || !inviteData.user) {
    return jsonResponse(
      { error: inviteError?.message ?? "Failed to resend invite." },
      400,
    );
  }

  const { error: profileError } = await serviceClient.from("profiles").insert({
    id: inviteData.user.id,
    org_id: orgId,
    role,
    email,
    joined_at: null,
    onboarding_complete: false,
  });

  if (profileError) {
    await serviceClient.auth.admin.deleteUser(inviteData.user.id);
    return jsonResponse({ error: profileError.message }, 500);
  }

  return jsonResponse({ ok: true, userId: inviteData.user.id });
});
