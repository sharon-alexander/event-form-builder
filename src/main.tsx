import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const MOUNT_ID = "roscioli-event-form";

// In the embeddable widget build, the bundle's CSS is captured onto this global
// (see vite.config.ts) instead of being injected into the host page's <head>.
const CSS_GLOBAL = "__ROSCIOLI_EFB_CSS__";

function mount() {
  const container = document.getElementById(MOUNT_ID);
  if (!container) return;

  const widgetCss = (globalThis as Record<string, unknown>)[CSS_GLOBAL] as
    | string
    | undefined;

  let mountPoint: HTMLElement = container;

  // When CSS was captured (widget build), render inside a shadow root so
  // Tailwind's global resets stay contained and never leak onto the host page.
  // Otherwise (dev / standalone preview) Vite injects CSS into <head> as usual
  // and we mount directly into the container.
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
      <App />
    </React.StrictMode>,
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
