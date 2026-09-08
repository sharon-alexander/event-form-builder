import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { LocationProvider } from "./context/LocationContext";
import { getLocation, tryGetLocation } from "./locations";
import type { LocationConfig } from "./locations";
import { fetchLocationBySlug } from "./locations/fromDb";
import { resolveReferralSources } from "./api/resolveReferralSources";
import { getSupabase } from "./lib/supabase";
import { applyTheme, type ThemeTokens } from "./theme/theme";
import { withTimeout } from "./lib/withTimeout";
import "./index.css";

const MOUNT_ID = "roscioli-event-form";

const CSS_GLOBAL = "__ROSCIOLI_EFB_CSS__";

function isPreviewPath(): boolean {
  return /^\/form\/[^/]+\/preview\/?$/.test(window.location.pathname);
}

/**
 * Resolve which location to load:
 *  1. `data-location` attribute on the mount element (best for embeds)
 *  2. `/form/:slug` or `/form/:slug/preview` pathname (standalone pages)
 *  3. `?location=` query parameter (convenience / dev)
 */
function resolveLocationId(container: HTMLElement): string | null {
  const fromAttr = container.getAttribute("data-location");
  if (fromAttr) return fromAttr;

  const match = window.location.pathname.match(/^\/form\/([^/]+)/);
  if (match?.[1]) return decodeURIComponent(match[1]);

  const params = new URLSearchParams(window.location.search);
  return params.get("location");
}

function LoadingState() {
  return (
    <div className="px-4 py-16 text-center text-sm text-gray-400">Loading…</div>
  );
}

function NotFoundState() {
  return (
    <div className="px-4 py-16 text-center">
      <h1 className="text-lg font-semibold text-gray-900">Form not found</h1>
      <p className="mt-2 text-sm text-gray-500">
        The event form you&apos;re looking for doesn&apos;t exist or hasn&apos;t
        been published yet.
      </p>
    </div>
  );
}

function SignInToPreviewState() {
  return (
    <div className="px-4 py-16 text-center">
      <h1 className="text-lg font-semibold text-gray-900">Sign in to preview</h1>
      <p className="mt-2 text-sm text-gray-500">
        Unpublished forms can only be previewed while signed in to the admin.
      </p>
      <a
        href="/admin"
        className="mt-6 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Go to admin
      </a>
    </div>
  );
}

function PreviewBanner() {
  // Break out of #roscioli-event-form's max-width so the bar spans the viewport.
  return (
    <div
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen border-b border-brand-200 bg-brand-50 px-4 py-2.5 text-center font-sans text-sm text-brand-800"
      role="status"
    >
      Preview — this form is not published. Visitors cannot see it yet.
    </div>
  );
}

async function mount() {
  const container = document.getElementById(MOUNT_ID);
  if (!container) return;

  const slug = resolveLocationId(container);
  const previewMode = isPreviewPath();

  const widgetCss = (globalThis as Record<string, unknown>)[CSS_GLOBAL] as
    | string
    | undefined;

  let mountPoint: HTMLElement = container;

  if (widgetCss) {
    const shadow =
      container.shadowRoot ?? container.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = widgetCss;
    const appRoot = document.createElement("div");
    shadow.replaceChildren(style, appRoot);
    mountPoint = appRoot;
  }

  const isWidget = !!widgetCss;

  const root = ReactDOM.createRoot(mountPoint);
  root.render(
    <React.StrictMode>
      <LoadingState />
    </React.StrictMode>,
  );

  // On standalone pages (/form/:slug), a missing slug means "not found".
  // Widgets (embeds) can still fall back to the default location.
  if (!slug && !isWidget) {
    root.render(
      <React.StrictMode>
        <NotFoundState />
      </React.StrictMode>,
    );
    return;
  }

  try {
    if (previewMode) {
      const supabase = getSupabase();
      if (!supabase) {
        root.render(
          <React.StrictMode>
            <SignInToPreviewState />
          </React.StrictMode>,
        );
        return;
      }
      const sessionData = await withTimeout(
        supabase.auth.getSession(),
        5000,
        { data: { session: null }, error: null },
      );
      if (!sessionData.data.session) {
        root.render(
          <React.StrictMode>
            <SignInToPreviewState />
          </React.StrictMode>,
        );
        return;
      }
    }

    // Prefer live config from Supabase; fall back to the bundled TS config so the
    // form still works if Supabase is unconfigured or unreachable.
    let config: LocationConfig | null = null;
    let theme: ThemeTokens | null = null;
    let published = true;
    try {
      const resolved = await withTimeout(
        fetchLocationBySlug(slug, { preview: previewMode }),
        8000,
        null,
      );
      if (resolved) {
        config = resolved.config;
        theme = resolved.theme;
        published = resolved.published;
      }
    } catch {
      // Supabase unavailable — try bundled configs below.
    }

    if (!config) {
      // Preview mode: no bundled fallback when signed in but row missing —
      // avoid showing a different location's config as an "unpublished" draft.
      if (!previewMode) {
        config = isWidget ? getLocation(slug) : tryGetLocation(slug);
      }
    }

    if (!config) {
      root.render(
        <React.StrictMode>
          <NotFoundState />
        </React.StrictMode>,
      );
      return;
    }

    // Warm the Tripleseat referral-ID cache without blocking first paint.
    // Submit resolves (and awaits) the same cached promise.
    void resolveReferralSources(config.tripleseat, config.name);

    applyTheme(mountPoint, theme);

    const showPreviewBanner = previewMode && !published;

    root.render(
      <React.StrictMode>
        <>
          {showPreviewBanner && <PreviewBanner />}
          <LocationProvider config={config}>
            <App />
          </LocationProvider>
        </>
      </React.StrictMode>,
    );
  } catch {
    root.render(
      <React.StrictMode>
        <NotFoundState />
      </React.StrictMode>,
    );
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
