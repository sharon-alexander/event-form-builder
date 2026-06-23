// Per-location theming.
//
// The Tailwind `brand` palette is wired to CSS custom properties (--brand-50 …
// --brand-950) whose default values live in src/index.css. `applyTheme` writes
// overrides onto a root element at runtime so each location can carry its own
// brand color and fonts. When a location has no theme, nothing is overridden and
// the defaults from index.css apply — so existing forms look unchanged.

export interface ThemeTokens {
  /** Base brand color as a hex string, e.g. "#b07038". Drives the full palette. */
  brandColor?: string;
  /** CSS font-family value for body text, e.g. `"Inter"`. */
  fontSans?: string;
  /** CSS font-family value for headings, e.g. `"Playfair Display"`. */
  fontDisplay?: string;
}

export const BRAND_STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type BrandStop = (typeof BRAND_STOPS)[number];

/** Target lightness (%) per stop. Hue + saturation come from the chosen color. */
const STOP_LIGHTNESS: Record<BrandStop, number> = {
  50: 96, 100: 90, 200: 80, 300: 68, 400: 57,
  500: 46, 600: 40, 700: 33, 800: 27, 900: 22, 950: 12,
};

/** The default brand color (matches the original brand-500). */
export const DEFAULT_BRAND_COLOR = "#b07038";
export const DEFAULT_FONT_SANS = '"Inter", system-ui, sans-serif';
export const DEFAULT_FONT_DISPLAY = '"Playfair Display", Georgia, serif';

/**
 * Apply a location's theme to a root element by setting CSS custom properties.
 * Pass `null`/`undefined` (or an empty object) to leave the index.css defaults
 * in place.
 */
export function applyTheme(root: HTMLElement, theme: ThemeTokens | null | undefined): void {
  if (!theme) return;

  if (theme.brandColor) {
    const palette = derivePalette(theme.brandColor);
    for (const stop of BRAND_STOPS) {
      root.style.setProperty(`--brand-${stop}`, palette[stop]);
    }
  }
  if (theme.fontSans) {
    root.style.setProperty("--font-sans", theme.fontSans);
  }
  if (theme.fontDisplay) {
    root.style.setProperty("--font-display", theme.fontDisplay);
  }
}

/** Derive an 11-stop palette from a base hex color. Values are "r g b" channel
 *  strings for use with `rgb(var(--brand-500) / <alpha>)`. */
export function derivePalette(hex: string): Record<BrandStop, string> {
  const rgb = hexToRgb(hex);
  const { h, s } = rgbToHsl(rgb);
  const out = {} as Record<BrandStop, string>;
  for (const stop of BRAND_STOPS) {
    const { r, g, b } = hslToRgb(h, s, STOP_LIGHTNESS[stop] / 100);
    out[stop] = `${r} ${g} ${b}`;
  }
  return out;
}

/** Convenience: a single hex color for a stop (used by the admin live preview). */
export function paletteHex(baseHex: string, stop: BrandStop): string {
  const channels = derivePalette(baseHex)[stop].split(" ").map(Number);
  return rgbToHex({ r: channels[0]!, g: channels[1]!, b: channels[2]! });
}

// ── color math ───────────────────────────────────────────────────────────────

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): Rgb {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  }
  const int = parseInt(h, 16);
  if (Number.isNaN(int) || h.length !== 6) {
    return { r: 176, g: 112, b: 56 }; // fall back to default brand-500
  }
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const to2 = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / delta + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / delta + 2) / 6;
        break;
      default:
        h = ((rn - gn) / delta + 4) / 6;
    }
  }
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, h) * 255),
    b: Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  };
}

function hueToRgb(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}
