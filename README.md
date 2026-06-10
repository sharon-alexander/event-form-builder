# Event Form Builder

A multi-step private event inquiry form that submits leads directly to Tripleseat. Built as an embeddable widget for Squarespace (or any website).

## Quick Start

```bash
npm install
cp .env.example .env   # then fill in your Tripleseat keys
npm run dev             # http://localhost:5173
```

## Tripleseat Setup

Before deploying, you need a few things from your Tripleseat account:

1. **Public API Key** (required) — Go to **Settings → Lead Forms → View Setup Codes → API Endpoint**. Copy the public key from the URL after `?public_key=`.

2. **Lead Form ID** (optional) — Links submissions to a specific lead form for tracking. Find yours at:
   ```
   https://api.tripleseat.com/v1/lead_forms.xml?public_key=YOUR_KEY
   ```

3. **Location ID** (optional, only if you have multiple locations) — Find yours at:
   ```
   https://api.tripleseat.com/v1/locations.xml?public_key=YOUR_KEY
   ```

4. **Disable spam detection on the lead form** — Go to **Settings → Lead Forms → Edit** on the relevant form and uncheck "Enable Spam Detection on Embedded Forms" (the widget includes its own honeypot protection).

Add your keys to `.env`:

```env
VITE_TRIPLESEAT_PUBLIC_KEY=your_public_key_here
VITE_TRIPLESEAT_LEAD_FORM_ID=123
VITE_TRIPLESEAT_LOCATION_ID=456
```

## Build

```bash
npm run build
```

This runs two builds into `dist/`:

| File | Purpose |
|---|---|
| `index.html` + `assets/` | A standalone preview page — open it to use the form directly (great for testing or sharing a link). |
| `event-form.iife.js` | The embeddable widget (CSS inlined) for Squarespace and other sites. |

You can also run them individually with `npm run build:app` and `npm run build:widget`.

## Deploy to Vercel

The repo includes a `vercel.json` and is ready to deploy as-is.

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project** and import the repo. Vercel auto-detects the Vite framework and uses `npm run build` → `dist/`.
3. **Add your Tripleseat keys as Environment Variables** (Project → Settings → Environment Variables). The `.env` file is gitignored, so the build needs these set in Vercel:
   - `VITE_TRIPLESEAT_PUBLIC_KEY`
   - `VITE_TRIPLESEAT_LEAD_FORM_ID`
   - `VITE_TRIPLESEAT_LOCATION_ID`

   These are read at **build time**, so after changing them, trigger a redeploy.
4. Deploy. Live deployment:
   - **Preview:** https://event-form-builder.vercel.app/
   - **Embed script:** https://event-form-builder.vercel.app/event-form.iife.js

> Any other static host works too (Netlify, GitHub Pages, S3 + CloudFront) — just serve the `dist/` folder.

## Embed on Squarespace

Requires a Squarespace **Core plan or higher** (custom JavaScript isn't allowed on the Basic/Personal plan).

Add a **Code Block** to the page (Add Block → Code → set the dropdown to **HTML**) with:

```html
<div id="roscioli-event-form"></div>
<script src="https://event-form-builder.vercel.app/event-form.iife.js"></script>
```

> Note: Squarespace often blocks scripts while you're logged into the editor. Test in an **incognito window** or via **Preview in Safe Mode**, not the editor preview.

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
