import { useEffect, useRef } from "react";
import {
  BRAND_STOPS,
  DEFAULT_BRAND_COLOR,
  DEFAULT_FONT_DISPLAY,
  DEFAULT_FONT_SANS,
  applyTheme,
} from "../../../theme/theme";
import type { EditableLocation } from "../../pages/FormEditorPage";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
}

const SANS_FONTS = [
  { label: "Inter (default)", value: '"Inter", system-ui, sans-serif' },
  { label: "System UI", value: "system-ui, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Helvetica / Arial", value: '"Helvetica Neue", Arial, sans-serif' },
];

const DISPLAY_FONTS = [
  { label: "Playfair Display (default)", value: '"Playfair Display", Georgia, serif' },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Inter", value: '"Inter", system-ui, sans-serif' },
  { label: "Times", value: '"Times New Roman", Times, serif' },
];

export default function ThemeTab({ draft, update }: Props) {
  const previewRef = useRef<HTMLDivElement>(null);
  const theme = draft.theme;
  const brandColor = theme.brandColor || DEFAULT_BRAND_COLOR;

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    // Clear previous overrides first so a reset falls back to the defaults.
    BRAND_STOPS.forEach((stop) => el.style.removeProperty(`--brand-${stop}`));
    el.style.removeProperty("--font-sans");
    el.style.removeProperty("--font-display");
    applyTheme(el, {
      brandColor: theme.brandColor,
      fontSans: theme.fontSans,
      fontDisplay: theme.fontDisplay,
    });
  }, [theme.brandColor, theme.fontSans, theme.fontDisplay]);

  function setTheme(patch: Partial<EditableLocation["theme"]>) {
    update({ theme: { ...theme, ...patch } });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div>
          <label className="efb-label" htmlFor="brandColor">
            Brand color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="brandColor"
              type="color"
              value={brandColor}
              onChange={(e) => setTheme({ brandColor: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded border border-slate-200 bg-white p-1"
            />
            <input
              className="efb-input py-2 font-mono"
              value={brandColor}
              onChange={(e) => setTheme({ brandColor: e.target.value })}
            />
            {theme.brandColor && (
              <button
                type="button"
                className="whitespace-nowrap text-xs font-medium text-gray-500 hover:text-gray-700"
                onClick={() => setTheme({ brandColor: undefined })}
              >
                Reset
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-400">
            A full palette of shades is generated from this color.
          </p>
        </div>

        <div>
          <label className="efb-label" htmlFor="fontSans">
            Body font
          </label>
          <select
            id="fontSans"
            className="efb-input"
            value={theme.fontSans ?? DEFAULT_FONT_SANS}
            onChange={(e) => setTheme({ fontSans: e.target.value })}
          >
            {SANS_FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="efb-label" htmlFor="fontDisplay">
            Heading font
          </label>
          <select
            id="fontDisplay"
            className="efb-input"
            value={theme.fontDisplay ?? DEFAULT_FONT_DISPLAY}
            onChange={(e) => setTheme({ fontDisplay: e.target.value })}
          >
            {DISPLAY_FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            Custom Google Fonts must also be loaded on the embedding page.
          </p>
        </div>
      </div>

      {/* Live preview */}
      <div>
        <p className="efb-label">Preview</p>
        <div
          ref={previewRef}
          className="rounded-2xl border border-slate-200 bg-white p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            {draft.form_title || "Private Events"}
          </p>
          <h3 className="font-display text-2xl font-semibold text-gray-900">
            {draft.name || "Venue name"}
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            A quick look at how your brand color and fonts come together.
          </p>
          <div className="mt-4 flex gap-2">
            <span className="efb-btn-primary px-5 py-2">Primary</span>
            <span className="efb-btn-secondary px-5 py-2">Secondary</span>
          </div>
          <div className="mt-5 flex overflow-hidden rounded-lg border border-slate-200">
            {BRAND_STOPS.map((stop) => (
              <div
                key={stop}
                title={`brand-${stop}`}
                className="h-8 flex-1"
                style={{ backgroundColor: `rgb(var(--brand-${stop}))` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
