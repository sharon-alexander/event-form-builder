import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { LocationProvider } from "./context/LocationContext";
import { getLocation } from "./locations";
import type { LocationConfig } from "./locations";
import { fetchLocationBySlug } from "./locations/fromDb";
import { resolveReferralSources } from "./api/resolveReferralSources";
import { applyTheme, type ThemeTokens } from "./theme/theme";
import "./index.css";

const MOUNT_ID = "roscioli-event-form";

const CSS_GLOBAL = "__ROSCIOLI_EFB_CSS__";

/**
 * Resolve which location to load:
 *  1. `data-location` attribute on the mount element (best for embeds)
 *  2. `?location=` query parameter (handy for standalone preview)
 *  3. Falls back to the default location
 */
function resolveLocationId(container: HTMLElement): string | null {
  const fromAttr = container.getAttribute("data-location");
  if (fromAttr) return fromAttr;

  const params = new URLSearchParams(window.location.search);
  return params.get("location");
}

function LoadingState() {
  return (
    <div className="px-4 py-16 text-center text-sm text-gray-400">Loading…</div>
  );
}

async function mount() {
  const container = document.getElementById(MOUNT_ID);
  if (!container) return;

  const slug = resolveLocationId(container);

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

  const root = ReactDOM.createRoot(mountPoint);
  root.render(
    <React.StrictMode>
      <LoadingState />
    </React.StrictMode>,
  );

  // Prefer live config from Supabase; fall back to the bundled TS config so the
  // form still works if Supabase is unconfigured or unreachable.
  let config: LocationConfig;
  let theme: ThemeTokens | null = null;
  try {
    const resolved = await fetchLocationBySlug(slug);
    if (resolved) {
      config = resolved.config;
      theme = resolved.theme;
    } else {
      config = getLocation(slug);
    }
  } catch {
    config = getLocation(slug);
  }

  try {
    const referral = await resolveReferralSources(config.tripleseat, config.name);
    config = {
      ...config,
      referralSourceIds: referral.referralSourceIds,
      referralOtherSourceId: referral.referralOtherSourceId,
    };
  } catch {
    // Keep referral IDs from the bundled/DB config if the Tripleseat lookup fails.
  }

  applyTheme(mountPoint, theme);

  root.render(
    <React.StrictMode>
      <LocationProvider config={config}>
        <App />
      </LocationProvider>
    </React.StrictMode>,
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
