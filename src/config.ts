/** Public site URL for gallery assets (required for Squarespace embed in production). */
export const SITE_URL =
  import.meta.env.VITE_SITE_URL ??
  (import.meta.env.DEV ? "" : "https://event-form-builder.vercel.app");

export function assetUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
