import {
  corsPreflightResponse,
  jsonResponse,
  requireSuperAdmin,
} from "../_shared/auth.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const VALID_ROLES = new Set(["super_admin", "editor"]);

/** Escape LIKE metacharacters so ilike is an exact, case-insensitive match. */
function exactIlike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&");
}

async function findAuthUserIdByEmail(
  serviceClient: SupabaseClient,
  email: string,
): Promise<string | null> {
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await serviceClient.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(error.message);
    const match = data.users.find(
      (u) => u.email?.toLowerCase() === email,
    );
    if (match) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflightResponse();
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const auth = await requireSuperAdmin(req);
  if (auth instanceof Response) return auth;

  const { profile, serviceClient } = auth;

  let body: { email?: string; role?: string; redirectTo?: string };
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
    .ilike("email", exactIlike(email))
    .maybeSingle();

  if (existing) {
    return jsonResponse({ error: "A user with this email already exists." }, 409);
  }

  const redirectTo = body.redirectTo || Deno.env.get("ADMIN_SET_PASSWORD_URL");
  if (!redirectTo) {
    return jsonResponse({ error: "ADMIN_SET_PASSWORD_URL is not configured." }, 500);
  }

  // Remove orphaned auth users left after a prior delete so invite always
  // creates a fresh pending account (not a resurrected previously-joined user).
  // Never delete when a profile is linked by id — deleteUser cascades.
  try {
    const orphanId = await findAuthUserIdByEmail(serviceClient, email);
    if (orphanId) {
      const { data: linkedProfile } = await serviceClient
        .from("profiles")
        .select("id")
        .eq("id", orphanId)
        .maybeSingle();
      if (linkedProfile) {
        return jsonResponse({ error: "A user with this email already exists." }, 409);
      }
      const { error: orphanDeleteError } =
        await serviceClient.auth.admin.deleteUser(orphanId);
      if (orphanDeleteError) {
        return jsonResponse({ error: orphanDeleteError.message }, 500);
      }
    }
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : "Failed to clean up auth user." },
      500,
    );
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
      joined_at: null,
      onboarding_complete: false,
    })
    .select("id, org_id, role, email, created_at, joined_at, onboarding_complete")
    .single();

  if (profileError) {
    await serviceClient.auth.admin.deleteUser(inviteData.user.id);
    return jsonResponse({ error: profileError.message }, 500);
  }

  return jsonResponse({ profile: newProfile });
});
