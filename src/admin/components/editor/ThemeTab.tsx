import { useEffect, useRef, useState } from "react";
import {
  BRAND_STOPS,
  DEFAULT_BRAND_COLOR,
  DEFAULT_FONT_DISPLAY,
  DEFAULT_FONT_SANS,
  applyTheme,
} from "../../../theme/theme";
import { uploadGalleryFile } from "../../api";
import type { EditableLocation } from "../../pages/FormEditorPage";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
  orgId: string | null;
  onError: (msg: string) => void;
}

const SANS_FONTS = [
  { label: "Inter (default)", value: '"Inter", system-ui, sans-serif' },
  { label: "System UI", value: "system-ui, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Helvetica / Arial", value: '"Helvetica Neue", Arial, sans-serif' },
];

const DISPLAY_FONTS = [
  {
    label: "Playfair Display (default)",
    value: '"Playfair Display", Georgia, serif',
  },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Inter", value: '"Inter", system-ui, sans-serif' },
  { label: "Times", value: '"Times New Roman", Times, serif' },
];

export default function ThemeTab({ draft, update, orgId, onError }: Props) {
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
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

  async function handleLogoFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!orgId) {
      onError("Cannot upload before the form has loaded.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      onError("Logo must be an image file.");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadGalleryFile(orgId, draft.slug, file);
      setTheme({ logoUrl: url });
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div>
          <label className="adm-label">Logo</label>
          <div className="flex items-center gap-4">
            {theme.logoUrl ? (
              <img
                src={theme.logoUrl}
                alt="Logo preview"
                className="h-16 w-16 rounded-full object-cover ring-1 ring-zinc-200"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-400 ring-1 ring-zinc-200">
                No logo
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleLogoFile(e.target.files)}
              />
              <button
                type="button"
                disabled={uploading}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50"
                onClick={() => fileInput.current?.click()}
              >
                {uploading
                  ? "Uploading…"
                  : theme.logoUrl
                    ? "Replace"
                    : "Upload"}
              </button>
              {theme.logoUrl && (
                <button
                  type="button"
                  aria-label="Remove logo"
                  title="Remove logo"
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-500 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  onClick={() => {
                    const { logoUrl: _removed, ...rest } = theme;
                    update({ theme: rest });
                  }}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0v12a1 1 0 001 1h6a1 1 0 001-1V7"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Shown above the venue name on the landing page.
          </p>
        </div>

        <div>
          <label className="adm-label" htmlFor="brandColor">
            Brand color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="brandColor"
              type="color"
              value={brandColor}
              onChange={(e) => setTheme({ brandColor: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded border border-zinc-200 bg-white p-1"
            />
            <input
              className="adm-input py-2 font-mono"
              value={brandColor}
              onChange={(e) => setTheme({ brandColor: e.target.value })}
            />
            {theme.brandColor && (
              <button
                type="button"
                className="whitespace-nowrap text-xs font-medium text-zinc-500 hover:text-zinc-700"
                onClick={() => setTheme({ brandColor: undefined })}
              >
                Reset
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            A full palette of shades is generated from this color.
          </p>
        </div>

        <div>
          <label className="adm-label" htmlFor="fontSans">
            Body font
          </label>
          <select
            id="fontSans"
            className="adm-input"
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
          <label className="adm-label" htmlFor="fontDisplay">
            Heading font
          </label>
          <select
            id="fontDisplay"
            className="adm-input"
            value={theme.fontDisplay ?? DEFAULT_FONT_DISPLAY}
            onChange={(e) => setTheme({ fontDisplay: e.target.value })}
          >
            {DISPLAY_FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-400">
            Custom Google Fonts must also be loaded on the embedding page.
          </p>
        </div>
      </div>

      {/* Live preview */}
      <div>
        <p className="adm-label">Preview</p>
        <div
          ref={previewRef}
          className="rounded-2xl border border-zinc-200 bg-white p-6 text-center"
        >
          {theme.logoUrl && (
            <img
              src={theme.logoUrl}
              alt=""
              className="mx-auto mb-3 h-14 w-auto max-w-[10rem] object-contain"
            />
          )}
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            {draft.form_title || "Private Events"}
          </p>
          <h3 className="font-display text-2xl font-semibold text-zinc-900">
            {draft.name || "Venue name"}
          </h3>
          <p className="mt-2 text-sm text-zinc-600">
            A quick look at how your brand color and fonts come together.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <span className="efb-btn-primary px-5 py-2">Primary</span>
            <span className="efb-btn-secondary px-5 py-2">Secondary</span>
          </div>
          <div className="mt-5 flex overflow-hidden rounded-lg border border-zinc-200">
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
