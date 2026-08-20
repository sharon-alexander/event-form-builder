import {
  corsPreflightResponse,
  jsonResponse,
  requireSuperAdmin,
} from "../_shared/auth.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/** Temporary unique address so inviteUserByEmail can claim the real one. */
function parkedEmail(userId: string): string {
  return `hold.${userId}@resend-hold.invalid`;
}

async function findAuthUserIdByEmail(
  serviceClient: SupabaseClient,
  email: string,
): Promise<string | null> {
  const needle = email.toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await serviceClient.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(error.message);
    const match = data.users.find(
      (u) => u.email?.toLowerCase() === needle,
    );
    if (match) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

/**
 * Invite may create an auth user even when sending the email fails.
 * Delete that occupant (never the original), then put the real email back.
 */
async function restoreOriginalEmail(
  serviceClient: SupabaseClient,
  originalId: string,
  email: string,
  createdUserId?: string | null,
): Promise<string | null> {
  const idsToRemove = new Set<string>();
  if (createdUserId && createdUserId !== originalId) {
    idsToRemove.add(createdUserId);
  }

  let lookupError: string | null = null;
  try {
    const occupantId = await findAuthUserIdByEmail(serviceClient, email);
    if (occupantId && occupantId !== originalId) {
      idsToRemove.add(occupantId);
    }
  } catch (err) {
    lookupError = err instanceof Error ? err.message : "Failed to look up auth user.";
  }

  for (const id of idsToRemove) {
    const { error } = await serviceClient.auth.admin.deleteUser(id);
    if (error) return error.message;
  }

  const { error } = await serviceClient.auth.admin.updateUserById(originalId, {
    email,
  });
  if (error) {
    return lookupError ? `${error.message} (${lookupError})` : error.message;
  }
  return null;
}

function failAfterRestore(
  primary: string,
  restoreError: string | null,
  status: number,
): Response {
  return jsonResponse(
    {
      error: restoreError
        ? `${primary} Also failed to restore the original user: ${restoreError}`
        : primary,
    },
    restoreError ? 500 : status,
  );
}

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
  // resetPasswordForEmail sends the wrong template. Re-invite so Supabase
  // sends the real "Invite user" email again.
  //
  // Do not delete the pending member first: inviteUserByEmail / profile
  // insert can fail (e.g. SMTP still rolling out). Park the original auth
  // email instead, then delete only after the replacement profile exists.
  const email = target.email;
  const role = target.role;
  const orgId = target.org_id;

  const { error: parkError } = await serviceClient.auth.admin.updateUserById(
    targetId,
    { email: parkedEmail(targetId) },
  );
  if (parkError) {
    return jsonResponse({ error: parkError.message }, 500);
  }

  const { data: inviteData, error: inviteError } =
    await serviceClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { org_id: orgId },
    });

  if (inviteError || !inviteData.user) {
    const restoreError = await restoreOriginalEmail(
      serviceClient,
      targetId,
      email,
      inviteData?.user?.id,
    );
    return failAfterRestore(
      inviteError?.message ?? "Failed to resend invite.",
      restoreError,
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
    const restoreError = await restoreOriginalEmail(
      serviceClient,
      targetId,
      email,
      inviteData.user.id,
    );
    return failAfterRestore(profileError.message, restoreError, 500);
  }

  const { error: cleanupError } = await serviceClient.auth.admin.deleteUser(targetId);
  if (cleanupError) {
    // Invite and new profile succeeded. Drop the old profiles row so the
    // pending member is not listed twice; leftover auth user is an orphan
    // with a parked email (invite-admin already cleans those up).
    const { error: profileCleanupError } = await serviceClient
      .from("profiles")
      .delete()
      .eq("id", targetId);
    if (profileCleanupError) {
      return jsonResponse(
        {
          error:
            `Invite sent but the previous pending user could not be removed: ${cleanupError.message}`,
        },
        500,
      );
    }
  }

  return jsonResponse({ ok: true, userId: inviteData.user.id });
});
