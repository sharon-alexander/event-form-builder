import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { ThemeTokens } from "../../theme/theme";
import type {
  BudgetOption,
  MediaItem,
  TripleseatConfig,
  VenueSpaceOption,
} from "../../locations/types";
import type { LocationRow } from "../../locations/fromDb";
import {
  getLocationById,
  updateLocation,
  type LocationUpdate,
} from "../api";
import ContentTab from "../components/editor/ContentTab";
import GalleryTab from "../components/editor/GalleryTab";
import OptionsTab from "../components/editor/OptionsTab";
import ThemeTab from "../components/editor/ThemeTab";
import AdvancedTab from "../components/editor/AdvancedTab";

/** The editable subset of a location, with arrays/objects guaranteed non-null. */
export interface EditableLocation {
  slug: string;
  name: string;
  form_title: string;
  about_blurb: string;
  gallery_media: MediaItem[];
  venue_spaces: VenueSpaceOption[];
  budget_options: BudgetOption[];
  tripleseat: Partial<TripleseatConfig>;
  theme: ThemeTokens;
  published: boolean;
}

const TABS = [
  { id: "content", label: "Content" },
  { id: "gallery", label: "Gallery" },
  { id: "options", label: "Venues & Budgets" },
  { id: "theme", label: "Theme" },
  { id: "advanced", label: "Advanced" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function toEditable(row: LocationRow): EditableLocation {
  return {
    slug: row.slug,
    name: row.name,
    form_title: row.form_title,
    about_blurb: row.about_blurb,
    gallery_media: row.gallery_media ?? [],
    venue_spaces: row.venue_spaces ?? [],
    budget_options: row.budget_options ?? [],
    tripleseat: row.tripleseat ?? {},
    theme: row.theme ?? {},
    published: row.published,
  };
}

export default function FormEditorPage() {
  const { id } = useParams<{ id: string }>();

  const [orgId, setOrgId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditableLocation | null>(null);
  const [tab, setTab] = useState<TabId>("content");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    getLocationById(id)
      .then((row) => {
        if (!active) return;
        if (!row) {
          setError("Form not found.");
          return;
        }
        setOrgId(row.org_id);
        setDraft(toEditable(row));
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : String(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const update = useCallback((patch: Partial<EditableLocation>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
    setDirty(true);
    setNotice(null);
  }, []);

  async function handleSave() {
    if (!id || !draft) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const patch: LocationUpdate = {
        slug: draft.slug,
        name: draft.name,
        form_title: draft.form_title,
        about_blurb: draft.about_blurb,
        gallery_media: draft.gallery_media,
        venue_spaces: draft.venue_spaces,
        budget_options: draft.budget_options,
        tripleseat: draft.tripleseat,
        theme: draft.theme,
        published: draft.published,
      };
      await updateLocation(id, patch);
      setDirty(false);
      setNotice("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const previewUrl = useMemo(
    () => (draft ? `/?location=${encodeURIComponent(draft.slug)}` : "/"),
    [draft],
  );

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;
  if (!draft) {
    return (
      <div>
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error ?? "Form not found."}
        </p>
        <Link to="/" className="text-sm font-medium text-brand-700 hover:underline">
          ← Back to forms
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/" className="text-sm font-medium text-gray-500 hover:text-gray-700">
          ← All forms
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold text-gray-900">
            {draft.name}
          </h1>
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) => update({ published: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Published
            </label>
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="efb-btn-secondary px-4 py-2"
            >
              Preview
            </a>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="efb-btn-primary px-5 py-2"
            >
              {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {notice && (
        <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {notice}
        </p>
      )}

      <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        {tab === "content" && <ContentTab draft={draft} update={update} />}
        {tab === "gallery" && (
          <GalleryTab draft={draft} update={update} orgId={orgId} onError={setError} />
        )}
        {tab === "options" && <OptionsTab draft={draft} update={update} />}
        {tab === "theme" && <ThemeTab draft={draft} update={update} />}
        {tab === "advanced" && <AdvancedTab draft={draft} update={update} />}
      </div>

    </div>
  );
}
