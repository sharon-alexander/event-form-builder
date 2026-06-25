import {
  corsPreflightResponse,
  jsonResponse,
  requireSuperAdmin,
} from "../_shared/auth.ts";

const VALID_ROLES = new Set(["super_admin", "editor"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflightResponse();
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const auth = await requireSuperAdmin(req);
  if (auth instanceof Response) return auth;

  const { profile, serviceClient } = auth;

  let body: { email?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  const email = body.email?.trim().toLowerCase();
  const role = body.role?.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: "A valid email is required." }, 400);
  }
  if (!role || !VALID_ROLES.has(role)) {
    return jsonResponse({ error: "Role must be super_admin or editor." }, 400);
  }

  const { data: existing } = await serviceClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return jsonResponse({ error: "A user with this email already exists." }, 409);
  }

  const redirectTo = Deno.env.get("ADMIN_SET_PASSWORD_URL");
  if (!redirectTo) {
    return jsonResponse({ error: "ADMIN_SET_PASSWORD_URL is not configured." }, 500);
  }

  const { data: inviteData, error: inviteError } =
    await serviceClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { org_id: profile.org_id },
    });

  if (inviteError || !inviteData.user) {
    return jsonResponse(
      { error: inviteError?.message ?? "Failed to send invite." },
      400,
    );
  }

  const { data: newProfile, error: profileError } = await serviceClient
    .from("profiles")
    .insert({
      id: inviteData.user.id,
      org_id: profile.org_id,
      role,
      email,
    })
    .select("id, org_id, role, email, created_at")
    .single();

  if (profileError) {
    await serviceClient.auth.admin.deleteUser(inviteData.user.id);
    return jsonResponse({ error: profileError.message }, 500);
  }

  return jsonResponse({ profile: newProfile });
});
