# Supabase backend

The CMS uses Supabase for the database (form config), authentication (admin
logins), and storage (gallery images).

## 1. Create a project

Create a project at [supabase.com](https://supabase.com). From **Project
Settings → API** grab:

- **Project URL** → `VITE_SUPABASE_URL` (and `SUPABASE_URL` for the seed)
- **anon public key** → `VITE_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (seed only — keep secret)

## 2. Apply the migrations

Run the SQL in `migrations/` in order. Either paste each file into the Supabase
**SQL Editor**, or use the Supabase CLI:

```bash
supabase db push           # if you use the CLI with this folder linked
# or, manually:
psql "$SUPABASE_DB_URL" -f migrations/0001_init.sql
psql "$SUPABASE_DB_URL" -f migrations/0002_storage.sql
psql "$SUPABASE_DB_URL" -f migrations/0003_admin_users.sql
```

This creates the `organizations`, `profiles`, and `locations` tables with Row
Level Security, plus a public `gallery` storage bucket.

## 3. Seed the launch data

The seed creates one organization, an optional admin login, and the three
launch locations (uploading any images found under `public/gallery/<slug>/`).

```bash
# In your project .env (gitignored):
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...            # service_role, not anon
SEED_ORG_NAME="Airmax Hospitality"
SEED_ORG_SLUG="airmax-hospitality"
SEED_ADMIN_EMAIL=you@example.com            # optional: creates a login
SEED_ADMIN_PASSWORD=a-strong-password       # optional

node supabase/seed/seed.mjs
```

The script is idempotent — re-running upserts the org and locations by slug.

## 4. Adding more admins / organizations

### Via the CMS (recommended)

Super-admins see a **Users** page in the admin dashboard (`/admin#/users`).
From there they can:

- Invite a colleague by email (the invitee receives a link to set their password)
- Assign roles: `super_admin` (can manage users) or `editor` (forms only)
- Remove users from the organization

This requires deploying the Edge Functions below and configuring Auth redirect URLs.

### Deploy Edge Functions

Install the [Supabase CLI](https://supabase.com/docs/guides/cli), link your
project, then:

```bash
supabase functions deploy invite-admin
supabase functions deploy remove-admin

# Secrets used by the invite function (set per environment):
supabase secrets set ADMIN_SET_PASSWORD_URL="https://yoursite.com/admin.html#/set-password"
```

For local development, use:

```
http://localhost:5173/admin.html#/set-password
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
provided automatically to Edge Functions by Supabase.

### Configure Auth redirect URLs

In the Supabase dashboard under **Authentication → URL Configuration**:

- **Site URL:** your production admin URL (e.g.
  `https://event-form-builder.vercel.app/admin.html`)
- **Redirect URLs:** add both dev and prod set-password URLs:
  - `http://localhost:5173/admin.html#/set-password`
  - `https://yoursite.com/admin.html#/set-password`

Confirm **Authentication → Email Templates → Invite user** is enabled.

### Manual fallback

- **Another admin in an existing org:** create the user in **Authentication →
  Users**, then insert a `profiles` row linking their `id` to the `org_id`.
- **A new organization:** insert an `organizations` row, then add a profile for
  its admin pointing at the new `org_id`.

## Data model

| Table           | Purpose                                                      |
| --------------- | ----------------------------------------------------------- |
| `organizations` | A restaurant group that owns one or more forms              |
| `profiles`      | An admin user (linked to `auth.users`), scoped to one org   |
| `locations`     | A single event form: content, gallery, options, theme, etc. |

RLS: admins can read/write only the `locations` in their own organization; the
public (anon) role can read only `published` locations. Storage writes are
restricted to each org's `org/<org_id>/...` prefix.
