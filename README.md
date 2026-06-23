# Event Form Builder

A multi-step private event inquiry form that submits leads directly to Tripleseat. Built as an embeddable widget for Squarespace (or any website). Supports multiple locations, each with its own venue spaces, images, budget options, theme, and Tripleseat credentials.

Locations are managed through a **CMS admin dashboard** (`/admin`) backed by Supabase. The public form loads its config from Supabase at runtime, and falls back to the bundled TypeScript configs in `src/locations/` if Supabase isn't configured. See [CMS Admin Dashboard](#cms-admin-dashboard).

## Locations

| Location | ID | Preview URL |
|---|---|---|
| Pearl Box Townhouse | `pearl-box` | `/form/pearl-box` |
| Roscioli | `roscioli` | `/form/roscioli` |
| Tokyo Record Bar | `tokyo-record-bar` | `/form/tokyo-record-bar` |

Location is resolved in this order:
1. `data-location` attribute on the mount element (best for embeds)
2. `/form/:slug` pathname (standalone pages)
3. `?location=` query parameter (convenience / dev)

Standalone pages with no slug (or an unknown slug) show a "Form not found" message instead of defaulting to a location.

## Quick Start

```bash
npm install
cp .env.example .env   # then fill in your Supabase + Tripleseat keys
npm run dev             # http://localhost:5173
```

Preview a specific location during development:

```
http://localhost:5173/form/roscioli
http://localhost:5173/form/tokyo-record-bar
```

The admin dashboard runs at:

```
http://localhost:5173/admin   (or /admin.html)
```

The root URL (`/`) redirects to `/admin` in production. In dev, navigate
directly to `/admin` or `/form/<slug>`.

## CMS Admin Dashboard

Admins sign in at `/admin` to manage the event forms for their restaurant
**group** (organization). Each org's super-admin can see and edit every form
that belongs to their org; the public (anon) role can only read published forms.

What you can edit per form:

- **Content** — venue name, URL slug, eyebrow label, about blurb
- **Gallery** — upload/reorder/remove images and videos (stored in Supabase Storage), edit alt text
- **Venues & Budgets** — the venue space and budget range options
- **Theme** — brand color (a full palette is derived from it) and body/heading fonts, with a live preview
- **Advanced** — Tripleseat credentials (referral source IDs are resolved automatically from Tripleseat)
- **Publish** — toggle a form live; "Preview" opens `/form/<slug>`

### Supabase setup

The backend (database, auth, storage) lives in Supabase. Full setup,
migrations, and the seed script are documented in
[`supabase/README.md`](supabase/README.md). In short:

1. Create a Supabase project and run the SQL in `supabase/migrations/`.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env` (and Vercel).
3. Seed the launch data and create an admin login:
   ```bash
   node supabase/seed/seed.mjs
   ```

### Theming

The Tailwind `brand` palette is backed by CSS variables whose defaults live in
`src/index.css`. A form's saved `theme` (brand color + fonts) is applied at
runtime by `src/theme/theme.ts` — so unedited forms look exactly as before, and
edited ones restyle automatically. Custom fonts must also be loaded on the
embedding page (the standalone preview already loads Inter + Playfair Display).

## Tripleseat Setup

Each location needs its own Tripleseat credentials. From your Tripleseat account:

1. **Public API Key** — Go to **Settings → Lead Forms → View Setup Codes → API Endpoint**. Copy the public key from the URL after `?public_key=`.

2. **Lead Form ID** — Links submissions to a specific lead form. Find yours at:
   ```
   https://api.tripleseat.com/v1/lead_forms.xml?public_key=YOUR_KEY
   ```

3. **Location ID** — Find yours at:
   ```
   https://api.tripleseat.com/v1/locations.xml?public_key=YOUR_KEY
   ```

4. **Disable spam detection on each lead form** — Go to **Settings → Lead Forms → Edit** on the relevant form and uncheck "Enable Spam Detection on Embedded Forms" (the widget includes its own honeypot protection).

Add your keys to `.env`:

```env
# Pearl Box Townhouse
VITE_PEARL_BOX_TRIPLESEAT_PUBLIC_KEY=your_key
VITE_PEARL_BOX_TRIPLESEAT_LEAD_FORM_ID=123
VITE_PEARL_BOX_TRIPLESEAT_LOCATION_ID=456

# Roscioli
VITE_ROSCIOLI_TRIPLESEAT_PUBLIC_KEY=your_key
VITE_ROSCIOLI_TRIPLESEAT_LEAD_FORM_ID=789
VITE_ROSCIOLI_TRIPLESEAT_LOCATION_ID=012

# Tokyo Record Bar
VITE_TRB_TRIPLESEAT_PUBLIC_KEY=your_key
VITE_TRB_TRIPLESEAT_LEAD_FORM_ID=345
VITE_TRB_TRIPLESEAT_LOCATION_ID=678
```

## Build

```bash
npm run build
```

This runs two builds into `dist/`:

| File | Purpose |
|---|---|
| `index.html` + `assets/` | A standalone preview page — open it to use the form directly (great for testing or sharing a link). |
| `admin.html` | The CMS admin dashboard (served at `/admin`). |
| `event-form.iife.js` | The embeddable widget (CSS inlined) for Squarespace and other sites. |

You can also run them individually with `npm run build:app` and `npm run build:widget`.

## Deploy to Vercel

The repo includes a `vercel.json` and is ready to deploy as-is.

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project** and import the repo. Vercel auto-detects the Vite framework and uses `npm run build` → `dist/`.
3. **Add your Environment Variables** (Project → Settings → Environment Variables). The `.env` file is gitignored, so the build needs these set in Vercel:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (powers the CMS + runtime config)
   - Optional Tripleseat fallbacks for the bundled configs: `VITE_PEARL_BOX_TRIPLESEAT_*`, `VITE_ROSCIOLI_TRIPLESEAT_*`, `VITE_TRB_TRIPLESEAT_*`

   These are read at **build time**, so after changing them, trigger a redeploy. (Tripleseat credentials managed in the dashboard are stored in Supabase and don't require a redeploy.)
4. Deploy. Live URLs:
   - **Pearl Box:** https://event-form-builder.vercel.app/form/pearl-box
   - **Roscioli:** https://event-form-builder.vercel.app/form/roscioli
   - **Tokyo Record Bar:** https://event-form-builder.vercel.app/form/tokyo-record-bar
   - **Admin dashboard:** https://event-form-builder.vercel.app/admin
   - **Embed script:** https://event-form-builder.vercel.app/event-form.iife.js

> Any other static host works too (Netlify, GitHub Pages, S3 + CloudFront) — just serve the `dist/` folder.

## Embed on Squarespace

Requires a Squarespace **Core plan or higher** (custom JavaScript isn't allowed on the Basic/Personal plan).

Add a **Code Block** to the page (Add Block → Code → set the dropdown to **HTML**) with:

```html
<div id="roscioli-event-form" data-location="pearl-box"></div>
<script src="https://event-form-builder.vercel.app/event-form.iife.js"></script>
```

Change `data-location` to `roscioli` or `tokyo-record-bar` for the other venues.

> Note: Squarespace often blocks scripts while you're logged into the editor. Test in an **incognito window** or via **Preview in Safe Mode**, not the editor preview.

## Adding a New Location

Once Supabase is set up, the preferred way is through the dashboard:

1. Go to `/admin`, sign in, and click **New form**.
2. Fill in the Content, Gallery, Venues & Budgets, Theme, and Advanced tabs.
3. Toggle **Published** and save.

To add a location to another **group**, create the organization and its admin in
Supabase first (see [`supabase/README.md`](supabase/README.md)).

> The bundled TypeScript configs in `src/locations/` remain only as a fallback
> for when Supabase isn't configured.

## Form Steps

1. Event type (private event / large party) + headcount
2. Event category (birthday, happy hour, holiday party, etc.)
3. Event format (seated, standing, seated + standing, not sure)
4. Event date or flexible date preferences
5. Budget range
6. Venue space selection with starting prices
7. Start / end time or flexible timing
8. Services of interest (florals, lighting, DJs, etc.)
9. Other venues being considered
10. Referral source
11. Contact information
12. Review & submit

## Tripleseat Field Mapping

| Form Field | Tripleseat Field |
|---|---|
| First/last name, email, phone | `first_name`, `last_name`, `email_address`, `phone_number` |
| Company | `company` |
| Headcount | `guest_count` |
| Event category | `event_description` |
| Booking type | `event_style` (onpremise / largeparty) |
| Event date | `event_date` |
| Start/end time | `start_time`, `end_time` |
| Everything else | `additional_information` (formatted text block) |
