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

  const { user, profile, serviceClient } = auth;

  let body: { userId?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  const targetId = body.userId?.trim();
  if (!targetId) {
    return jsonResponse({ error: "userId is required." }, 400);
  }

  if (targetId === user.id) {
    return jsonResponse({ error: "You cannot remove yourself." }, 400);
  }

  const { data: target, error: targetError } = await serviceClient
    .from("profiles")
    .select("id, org_id, role")
    .eq("id", targetId)
    .maybeSingle();

  if (targetError || !target) {
    return jsonResponse({ error: "User not found." }, 404);
  }

  if (target.org_id !== profile.org_id) {
    return jsonResponse({ error: "User is not in your organization." }, 403);
  }

  if (target.role === "super_admin") {
    const { count, error: countError } = await serviceClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("org_id", profile.org_id)
      .eq("role", "super_admin");

    if (countError) {
      return jsonResponse({ error: countError.message }, 500);
    }
    if ((count ?? 0) <= 1) {
      return jsonResponse(
        { error: "Cannot remove the last super_admin in the organization." },
        400,
      );
    }
  }

  const { error: deleteError } = await serviceClient.auth.admin.deleteUser(targetId);
  if (deleteError) {
    return jsonResponse({ error: deleteError.message }, 500);
  }

  return jsonResponse({ ok: true });
});
