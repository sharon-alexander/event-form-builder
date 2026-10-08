// Per-location theming.
//
// The Tailwind `brand` palette is wired to CSS custom properties (--brand-50 …
// --brand-950) whose default values live in src/index.css. `applyTheme` writes
// overrides onto a root element at runtime so each location can carry its own
// brand color and fonts. When a location has no theme, nothing is overridden and
// the defaults from index.css apply — so existing forms look unchanged.

export interface ThemeTokens {
  /** Base brand color as a hex string, e.g. "#b07038". Used as-is on main form
   *  elements (buttons, eyebrows, focus, selection). Lighter and darker shades
   *  are derived for accents only. */
  brandColor?: string;
  /** CSS font-family value for body text, e.g. `"Inter"`. */
  fontSans?: string;
  /** CSS font-family value for headings, e.g. `"Playfair Display"`. */
  fontDisplay?: string;
  /** Public URL of the venue logo image. */
  logoUrl?: string;
}

export const BRAND_STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type BrandStop = (typeof BRAND_STOPS)[number];

/** Stops that paint the entered hex exactly. These are the stops used by buttons,
 *  eyebrows, focus rings, and selected states. */
const EXACT_STOPS = new Set<BrandStop>([500, 600, 700]);

/** Mix toward white for accent tints (0 = exact color, 1 = white). */
const TINT_MIX: Partial<Record<BrandStop, number>> = {
  50: 0.92,
  100: 0.82,
  200: 0.64,
  300: 0.42,
  400: 0.2,
};

/** Mix toward black for accent shades (0 = exact color, 1 = black). */
const SHADE_MIX: Partial<Record<BrandStop, number>> = {
  800: 0.22,
  900: 0.4,
  950: 0.62,
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
    const exact = hexToRgb(theme.brandColor);
    const on = pickOnColor(exact);
    root.style.setProperty("--brand-on", channels(on));
    root.style.setProperty("--brand-btn-hover", channels(buttonHover(exact, on)));
  }
  if (theme.fontSans) {
    root.style.setProperty("--font-sans", theme.fontSans);
  }
  if (theme.fontDisplay) {
    root.style.setProperty("--font-display", theme.fontDisplay);
  }
}

/** Derive an 11-stop palette from a base hex color. Values are "r g b" channel
 *  strings for use with `rgb(var(--brand-500) / <alpha>)`.
 *
 *  Stops 500, 600, and 700 are the entered color with no shift. Other stops are
 *  tints (toward white) and shades (toward black) for backgrounds, borders,
 *  and hover states. */
export function derivePalette(hex: string): Record<BrandStop, string> {
  const rgb = hexToRgb(hex);
  const exact = `${rgb.r} ${rgb.g} ${rgb.b}`;
  const out = {} as Record<BrandStop, string>;
  for (const stop of BRAND_STOPS) {
    if (EXACT_STOPS.has(stop)) {
      out[stop] = exact;
      continue;
    }
    const tint = TINT_MIX[stop];
    const shade = SHADE_MIX[stop];
    const mixed =
      tint !== undefined
        ? mixRgb(rgb, { r: 255, g: 255, b: 255 }, tint)
        : mixRgb(rgb, { r: 0, g: 0, b: 0 }, shade ?? 0);
    out[stop] = `${mixed.r} ${mixed.g} ${mixed.b}`;
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

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const INK: Rgb = { r: 17, g: 24, b: 39 };

function channels({ r, g, b }: Rgb): string {
  return `${r} ${g} ${b}`;
}

/** Foreground that reads on the exact brand fill (white or near-black). */
function pickOnColor(bg: Rgb): Rgb {
  return contrast(bg, WHITE) >= contrast(bg, INK) ? WHITE : INK;
}

/** Darker than the button fill, stopped before `--brand-on` drops below 4.5:1.
 *  Mid colors that already miss 4.5 keep a small press state above 3.5:1. */
function buttonHover(exact: Rgb, on: Rgb): Rgb {
  const base = contrast(exact, on);
  const limit = base >= 4.5 ? 4.5 : Math.max(3.5, base - 0.4);
  for (let step = 22; step >= 4; step -= 2) {
    const mixed = mixRgb(exact, { r: 0, g: 0, b: 0 }, step / 100);
    if (contrast(mixed, on) >= limit) return mixed;
  }
  return exact;
}

function contrast(a: Rgb, b: Rgb): number {
  const hi = Math.max(luminance(a), luminance(b));
  const lo = Math.min(luminance(a), luminance(b));
  return (hi + 0.05) / (lo + 0.05);
}

function luminance({ r, g, b }: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

function mixRgb(base: Rgb, target: Rgb, amount: number): Rgb {
  const t = clamp(amount, 0, 1);
  return {
    r: Math.round(base.r + (target.r - base.r) * t),
    g: Math.round(base.g + (target.g - base.g) * t),
    b: Math.round(base.b + (target.b - base.b) * t),
  };
}
