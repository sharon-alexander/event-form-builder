const MOUNT_ID = "roscioli-event-form";
const WIDGET_PATH = "/event-form.iife.js";
const DEFAULT_PRODUCTION_URL = "https://event-form-builder.vercel.app";

/** Base URL for the public form host (no trailing slash). */
export function getPublicSiteUrl(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (import.meta.env.DEV) return window.location.origin;
  return DEFAULT_PRODUCTION_URL;
}

export function buildEmbedCode(slug: string): string {
  const base = getPublicSiteUrl();
  return `<div id="${MOUNT_ID}" data-location="${slug}"></div>\n<script src="${base}${WIDGET_PATH}"></script>`;
}

export function buildPreviewUrl(slug: string): string {
  return `${getPublicSiteUrl()}/?location=${encodeURIComponent(slug)}`;
}
