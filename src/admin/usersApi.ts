import { requireSupabase } from "../lib/supabase";

export type AdminRole = "super_admin" | "editor";

export interface OrgUser {
  id: string;
  org_id: string;
  role: AdminRole;
  email: string | null;
  created_at: string;
}

export async function listOrgUsers(): Promise<OrgUser[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, org_id, role, email, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as OrgUser[];
}

export async function updateOrgUserRole(userId: string, role: AdminRole): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw error;
}

async function callEdgeFunction(
  name: string,
  body: Record<string, unknown>,
): Promise<void> {
  const supabase = requireSupabase();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not signed in.");

  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const res = await fetch(`${url}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await res.json()) as { error?: string; profile?: OrgUser };
  if (!res.ok) {
    throw new Error(payload.error ?? `Request failed (${res.status}).`);
  }
}

export async function inviteOrgUser(email: string, role: AdminRole): Promise<void> {
  await callEdgeFunction("invite-admin", { email, role });
}

export async function removeOrgUser(userId: string): Promise<void> {
  await callEdgeFunction("remove-admin", { userId });
}
