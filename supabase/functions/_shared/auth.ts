import { createClient, type SupabaseClient, type User } from "https://esm.sh/@supabase/supabase-js@2";

export interface CallerProfile {
  id: string;
  org_id: string;
  role: string;
  email: string | null;
}

export interface AuthContext {
  user: User;
  profile: CallerProfile;
  userClient: SupabaseClient;
  serviceClient: SupabaseClient;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function corsPreflightResponse(): Response {
  return new Response("ok", { headers: corsHeaders });
}

export async function requireSuperAdmin(req: Request): Promise<AuthContext | Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return jsonResponse({ error: "Server misconfigured." }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Missing authorization." }, 401);
  }

  const jwt = authHeader.slice(7);
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return jsonResponse({ error: "Invalid session." }, 401);
  }

  const { data: profile, error: profileError } = await userClient
    .from("profiles")
    .select("id, org_id, role, email")
    .eq("id", userData.user.id)
    .maybeSingle<CallerProfile>();

  if (profileError || !profile) {
    return jsonResponse({ error: "Profile not found." }, 403);
  }

  if (profile.role !== "super_admin") {
    return jsonResponse({ error: "Only super_admins can perform this action." }, 403);
  }

  const serviceClient = createClient(supabaseUrl, serviceKey);

  return {
    user: userData.user,
    profile,
    userClient,
    serviceClient,
  };
}
