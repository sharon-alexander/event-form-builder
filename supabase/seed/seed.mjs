// ============================================================================
// Seed script — provisions one organization, an optional admin user, and the
// three launch locations, uploading any existing gallery images to Storage.
//
// Usage:
//   1. Apply the migrations in supabase/migrations/ first (see supabase/README.md).
//   2. Provide credentials via env vars (a project .env is loaded automatically):
//        SUPABASE_URL=...                      (your project URL)
//        SUPABASE_SERVICE_ROLE_KEY=...         (Project Settings -> API)
//      Optional:
//        SEED_ORG_NAME="Airmax Hospitality"
//        SEED_ORG_SLUG="airmax-hospitality"
//        SEED_ADMIN_EMAIL=admin@example.com    (creates an admin login)
//        SEED_ADMIN_PASSWORD=...
//      Tripleseat VITE_* vars (if set) are copied into each location.
//
//   3. Run:  node supabase/seed/seed.mjs
//
// Safe to re-run: it upserts the org and locations by slug.
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
import { LOCATIONS } from "./data.mjs";

/**
 * @typedef {Object} SeedLocation
 * @property {string} slug
 * @property {string} name
 * @property {string} form_title
 * @property {string} about_blurb
 * @property {boolean} published
 * @property {{ file: string, alt: string, type?: "image" | "video" }[]} gallery
 * @property {{ value: string, label: string, price: string }[]} venue_spaces
 * @property {{ value: string, label: string }[]} budget_options
 * @property {Record<string, unknown>} tripleseat
 * @property {Record<string, number>} referral_source_ids
 * @property {number} referral_other_source_id
 * @property {Record<string, unknown>} theme
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");

await loadDotEnv(join(PROJECT_ROOT, ".env"));

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Set them in your environment or .env, then re-run.",
  );
  process.exit(1);
}

const ORG_NAME = process.env.SEED_ORG_NAME || "Airmax Hospitality";
const ORG_SLUG = process.env.SEED_ORG_SLUG || "airmax-hospitality";
const BUCKET = "gallery";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  // Node < 22 has no native WebSocket; required for @supabase/supabase-js in scripts.
  realtime: { transport: ws },
});

console.log(`Seeding org "${ORG_NAME}" (${ORG_SLUG}) ...`);
const org = await upsertOrg();
console.log(`  org id: ${org.id}`);

await maybeCreateAdminUser(org.id);

for (const loc of LOCATIONS) {
  console.log(`\nSeeding location "${loc.slug}" ...`);
  const galleryMedia = await uploadGallery(org.id, loc);
  await upsertLocation(org.id, loc, galleryMedia);
  console.log(`  done (${galleryMedia.length} media items)`);
}

console.log("\nSeed complete.");

// ── helpers ──────────────────────────────────────────────────────────────────

async function upsertOrg() {
  const { data, error } = await admin
    .from("organizations")
    .upsert({ name: ORG_NAME, slug: ORG_SLUG }, { onConflict: "slug" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function maybeCreateAdminUser(orgId) {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log(
      "  (skipping admin user — set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create one)",
    );
    return;
  }

  let userId = await findUserIdByEmail(email);
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`  created admin user ${email}`);
  } else {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    console.log(`  updated password for existing admin ${email}`);
  }

  const { error: profileErr } = await admin
    .from("profiles")
    .upsert({ id: userId, org_id: orgId, role: "super_admin", email });
  if (profileErr) throw profileErr;
  console.log("  linked profile -> org");
}

async function findUserIdByEmail(email) {
  // listUsers is paginated; scan a few pages for the address.
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

/** Uploads any existing files and returns gallery_media entries (with public URLs). */
async function uploadGallery(orgId, loc) {
  const media = [];
  for (const item of loc.gallery) {
    const localPath = join(PROJECT_ROOT, "public", "gallery", loc.slug, item.file);
    const storagePath = `org/${orgId}/${loc.slug}/${item.file}`;
    const publicUrl = admin.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;

    if (existsSync(localPath)) {
      const body = await readFile(localPath);
      const { error } = await admin.storage
        .from(BUCKET)
        .upload(storagePath, body, { contentType: contentTypeFor(item.file), upsert: true });
      if (error) throw error;
      console.log(`  uploaded ${item.file}`);
    } else {
      console.log(`  (no local file for ${item.file} — keeping placeholder URL)`);
    }

    media.push({ type: item.type ?? "image", src: publicUrl, alt: item.alt });
  }
  return media;
}

async function upsertLocation(orgId, loc, galleryMedia) {
  const row = {
    org_id: orgId,
    slug: loc.slug,
    name: loc.name,
    form_title: loc.form_title,
    about_blurb: loc.about_blurb,
    gallery_media: galleryMedia,
    venue_spaces: loc.venue_spaces,
    budget_options: loc.budget_options,
    tripleseat: loc.tripleseat,
    referral_source_ids: loc.referral_source_ids,
    referral_other_source_id: loc.referral_other_source_id,
    theme: loc.theme,
    published: loc.published,
  };
  const { error } = await admin.from("locations").upsert(row, { onConflict: "slug" });
  if (error) throw error;
}

function contentTypeFor(file) {
  const ext = extname(file).toLowerCase();
  const map = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
  };
  return map[ext] ?? "application/octet-stream";
}

/** Minimal .env loader (no dependency); ignores comments and blank lines. */
async function loadDotEnv(path) {
  if (!existsSync(path)) return;
  const text = await readFile(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
