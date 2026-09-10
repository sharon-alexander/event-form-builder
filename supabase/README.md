# Supabase backend

The CMS uses Supabase for the database (form config), authentication (admin
logins), and storage (gallery images).

## 1. Create a project

Create a project at [supabase.com](https://supabase.com). From **Project
Settings → API** grab:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public key** → `VITE_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (Edge Functions / admin scripts only — keep secret)

## 2. Apply the migrations

```bash
supabase login
supabase init                              # first time only
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Project ref: **Project Settings → General → Reference ID**. Re-run `db push` for new files in `migrations/`.

If older migrations were already applied in the SQL Editor, mark them applied first (`supabase migration list` for IDs):

```bash
supabase migration repair --status applied 0001 0002 0003 0004 0005 0006 0008
supabase db push
```

Creates `organizations`, `profiles`, and `locations` with RLS, plus a public `gallery` bucket.

## 3. First admin and forms

Launch forms already live in the `locations` table. For a new empty project:

1. Insert an `organizations` row.
2. Create an Auth user, then a `profiles` row linking them to that org.
3. Sign in at `/admin` and create forms there.

Do not overwrite existing `locations` rows from files — the CMS is the source of truth.

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

# Secrets used by the invite / resend functions (set per environment).
# Do NOT include a hash (#/…) — Supabase PKCE appends ?code= and that breaks.
supabase secrets set ADMIN_SET_PASSWORD_URL="https://yoursite.com/admin"
```

For local development, use:

```
http://localhost:5173/admin
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
provided automatically to Edge Functions by Supabase.

### Configure Auth redirect URLs

In the Supabase dashboard under **Authentication → URL Configuration**:

- **Site URL:** your production admin URL (e.g.
  `https://event-form-builder.vercel.app/admin`)
- **Redirect URLs:** add both dev and prod admin URLs (no hash):
  - `http://localhost:5173/admin`
  - `https://event-form-builder.vercel.app/admin`
  - `https://yoursite.com/admin`

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
