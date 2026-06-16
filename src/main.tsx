import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { LocationProvider } from "./context/LocationContext";
import { getLocation } from "./locations";
import "./index.css";

const MOUNT_ID = "roscioli-event-form";

const CSS_GLOBAL = "__ROSCIOLI_EFB_CSS__";

/**
 * Resolve which location config to use:
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

function mount() {
  const container = document.getElementById(MOUNT_ID);
  if (!container) return;

  const locationId = resolveLocationId(container);
  const locationConfig = getLocation(locationId);

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
      <LocationProvider config={locationConfig}>
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
