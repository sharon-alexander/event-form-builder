import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useBeforeUnload,
  useBlocker,
  useParams,
  type BlockerFunction,
} from "react-router-dom";
import type { ThemeTokens } from "../../theme/theme";
import type {
  BudgetOption,
  EventChoiceOption,
  FieldId,
  FieldSettings,
  FormRulesDocument,
  InfoPageConfig,
  MediaItem,
  StepId,
  TimingHours,
  TripleseatConfig,
  VenueSpaceOption,
} from "../../locations/types";
import { DEFAULT_EVENT_CATEGORIES, EVENT_FORMATS } from "../../types";
import { EMPTY_FORM_RULES, parseFormRules } from "../../form/conditions";
import { parseTimingHours } from "../../form/timingHours";
import type { LocationRow } from "../../locations/fromDb";
import { hasOptionLabel } from "../../locations/presentableOptions";
import { parseFieldSettings } from "../../form/fieldCatalog";
import { mergeInfoPageIntoMoreDetails } from "../../utils/richText";
import {
  getLocationById,
  updateLocation,
  type LocationUpdate,
} from "../api";
import FormBuilderTab from "../components/editor/FormBuilderTab";
import MediaLibraryTab from "../components/editor/MediaLibraryTab";
import ThemeTab from "../components/editor/ThemeTab";
import AdvancedTab from "../components/editor/AdvancedTab";
import EmbedTab from "../components/editor/EmbedTab";
import PublishToggle from "../components/PublishToggle";
import UnsavedChangesDialog from "../components/UnsavedChangesDialog";
import { buildPreviewUrl } from "../embedCode";
import { useRegisterLeaveGuard, type LeaveAction } from "../unsavedGuard";
import { useFormMediaLibrary } from "../useFormMediaLibrary";

export interface EditableLocation {
  slug: string;
  name: string;
  form_title: string;
  about_blurb: string;
  gallery_media: MediaItem[];
  venue_spaces: VenueSpaceOption[];
  allow_multiple_venue_spaces: boolean;
  show_multi_day_rental: boolean;
  show_additional_load_in_out: boolean;
  show_full_day_rental: boolean;
  budget_options: BudgetOption[];
  event_categories: EventChoiceOption[];
  event_formats: EventChoiceOption[];
  form_steps: StepId[];
  step_more_details: Partial<Record<StepId, string>>;
  timing_style: string;
  timing_hours: TimingHours | null;
  info_page: InfoPageConfig | null;
  field_settings: Partial<Record<FieldId, FieldSettings>>;
  form_rules: FormRulesDocument;
  tripleseat: Partial<TripleseatConfig>;
  theme: ThemeTokens;
  published: boolean;
}

const TABS = [
  { id: "builder", label: "Form Builder" },
  { id: "media", label: "Media" },
  { id: "theme", label: "Theme" },
  { id: "embed", label: "Embed" },
  { id: "advanced", label: "Advanced" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const AUTOSAVE_DELAY_MS = 800;

function formatAutosaveTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function toEditable(row: LocationRow): EditableLocation {
  return {
    slug: row.slug,
    name: row.name,
    form_title: row.form_title,
    about_blurb: row.about_blurb,
    gallery_media: row.gallery_media ?? [],
    venue_spaces: row.venue_spaces ?? [],
    allow_multiple_venue_spaces: row.allow_multiple_venue_spaces ?? false,
    show_multi_day_rental: row.show_multi_day_rental ?? false,
    show_additional_load_in_out: row.show_additional_load_in_out ?? false,
    show_full_day_rental: row.show_full_day_rental ?? false,
    budget_options: row.budget_options ?? [],
    event_categories: row.event_categories ?? DEFAULT_EVENT_CATEGORIES,
    event_formats: row.event_formats ?? EVENT_FORMATS,
    form_steps:
      row.form_steps && row.form_steps.length > 0 ? row.form_steps : [],
    step_more_details: mergeInfoPageIntoMoreDetails(
      row.step_more_details ?? {},
      row.info_page,
    ),
    timing_style: row.timing_style || "standard",
    timing_hours: parseTimingHours(row.timing_hours),
    info_page: row.info_page ? { title: row.info_page.title } : null,
    field_settings: parseFieldSettings(row.field_settings),
    form_rules: parseFormRules(row.form_rules ?? EMPTY_FORM_RULES),
    tripleseat: row.tripleseat ?? {},
    theme: row.theme ?? {},
    published: row.published,
  };
}

export default function FormEditorPage() {
  const { id } = useParams<{ id: string }>();
  const library = useFormMediaLibrary(id ?? null);

  const [orgId, setOrgId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditableLocation | null>(null);
  const [tab, setTab] = useState<TabId>("builder");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [autosavedAt, setAutosavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingLeave, setPendingLeave] = useState<LeaveAction | null>(null);
  const dirtyRef = useRef(false);
  const revisionRef = useRef(0);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const idRef = useRef(id);
  idRef.current = id;
  const saveQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const saveAbortRef = useRef<AbortController | null>(null);
  const saveEpochRef = useRef(0);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    dirtyRef.current = false;
    revisionRef.current = 0;
    setDirty(false);
    setAutosavedAt(null);
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
    revisionRef.current += 1;
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
    dirtyRef.current = true;
    setDirty(true);
  }, []);

  const performSave = useCallback(async (): Promise<boolean> => {
    const locationId = idRef.current;
    const current = draftRef.current;
    if (!locationId || !current || !dirtyRef.current) return true;

    const revision = revisionRef.current;
    const epoch = saveEpochRef.current;
    const controller = new AbortController();
    saveAbortRef.current = controller;
    setSaving(true);
    setError(null);
    try {
      const venue_spaces = current.venue_spaces.filter(hasOptionLabel);
      const budget_options = current.budget_options.filter(hasOptionLabel);
      const patch: LocationUpdate = {
        slug: current.slug,
        name: current.name,
        form_title: current.form_title,
        about_blurb: current.about_blurb,
        gallery_media: current.gallery_media,
        venue_spaces,
        allow_multiple_venue_spaces: current.allow_multiple_venue_spaces,
        show_multi_day_rental: current.show_multi_day_rental,
        show_additional_load_in_out: current.show_additional_load_in_out,
        show_full_day_rental: current.show_full_day_rental,
        budget_options,
        event_categories: current.event_categories,
        event_formats: current.event_formats,
        form_steps: current.form_steps,
        step_more_details: current.step_more_details,
        timing_style: current.timing_style,
        timing_hours: current.timing_hours,
        info_page: current.info_page
          ? { title: current.info_page.title }
          : null,
        field_settings: current.field_settings,
        form_rules: current.form_rules,
        tripleseat: current.tripleseat,
        theme: current.theme,
        published: current.published,
      };
      await updateLocation(locationId, patch, controller.signal);
      if (
        controller.signal.aborted ||
        saveEpochRef.current !== epoch ||
        idRef.current !== locationId
      ) {
        return false;
      }
      if (revisionRef.current === revision) {
        dirtyRef.current = false;
        setDirty(false);
      }
      setAutosavedAt(new Date());
      return true;
    } catch (err) {
      if (controller.signal.aborted || saveEpochRef.current !== epoch) return false;
      if (idRef.current === locationId) {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
      return false;
    } finally {
      if (saveAbortRef.current === controller) {
        saveAbortRef.current = null;
        setSaving(false);
      }
    }
  }, []);

  const handleSave = useCallback((): Promise<boolean> => {
    const run = saveQueueRef.current.then(() => performSave());
    saveQueueRef.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }, [performSave]);

  const registerLeaveGuard = useRegisterLeaveGuard();
  const pendingLeaveRef = useRef(pendingLeave);
  pendingLeaveRef.current = pendingLeave;

  useEffect(() => {
    registerLeaveGuard((action) => {
      if (!dirtyRef.current) {
        void action();
        return;
      }
      setPendingLeave(() => action);
    });
    return () => registerLeaveGuard(null);
  }, [registerLeaveGuard]);

  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      dirtyRef.current && currentLocation.pathname !== nextLocation.pathname,
    [],
  );
  const blocker = useBlocker(shouldBlock);
  const blockerRef = useRef(blocker);
  blockerRef.current = blocker;

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!dirty) return;
        event.preventDefault();
        event.returnValue = "";
      },
      [dirty],
    ),
  );

  const stay = useCallback(() => {
    setPendingLeave(null);
    if (blockerRef.current.state === "blocked") blockerRef.current.reset();
  }, []);

  const discard = useCallback(() => {
    const action = pendingLeaveRef.current;
    setPendingLeave(null);
    saveEpochRef.current += 1;
    saveAbortRef.current?.abort();
    dirtyRef.current = false;
    setDirty(false);
    if (blockerRef.current.state === "blocked") blockerRef.current.proceed();
    if (action) void action();
  }, []);

  const saveAndLeave = useCallback(async () => {
    const ok = await handleSave();
    const action = pendingLeaveRef.current;
    const current = blockerRef.current;
    if (!ok) {
      setPendingLeave(null);
      if (current.state === "blocked") current.reset();
      return;
    }
    dirtyRef.current = false;
    setPendingLeave(null);
    if (current.state === "blocked") current.proceed();
    if (action) void action();
  }, [handleSave]);

  const promptOpen = blocker.state === "blocked" || pendingLeave !== null;

  useEffect(() => {
    if (!dirty || promptOpen) return;
    const timer = window.setTimeout(() => {
      void handleSave();
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [dirty, draft, promptOpen, handleSave]);

  const previewUrl = useMemo(
    () => (draft ? buildPreviewUrl(draft.slug) : "/"),
    [draft],
  );

  const leaveDialog = (
    <UnsavedChangesDialog
      open={promptOpen}
      saving={saving}
      onStay={stay}
      onDiscard={discard}
      onSave={() => {
        void saveAndLeave();
      }}
    />
  );

  if (loading) {
    return (
      <>
        {leaveDialog}
        <p className="text-sm text-zinc-400">Loading…</p>
      </>
    );
  }
  if (!draft) {
    return (
      <div>
        {leaveDialog}
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error ?? "Form not found."}
        </p>
        <Link to="/" className="text-sm font-medium text-zinc-700 hover:underline">
          ← Back to forms
        </Link>
      </div>
    );
  }

  const saveStatus = saving
    ? "Saving…"
    : autosavedAt
      ? `Autosaved at ${formatAutosaveTime(autosavedAt)}`
      : null;

  return (
    <div>
      {leaveDialog}
      <div className="mb-6">
        <Link to="/" className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900">
          ← All forms
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {draft.name}
          </h1>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-3">
              <PublishToggle
                published={draft.published}
                onChange={(published) => update({ published })}
              />
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="adm-btn-secondary px-4 py-2"
              >
                Preview
              </a>
              <button
                type="button"
                onClick={() => {
                  void handleSave();
                }}
                disabled={saving || !dirty}
                className="adm-btn-primary min-w-[9.25rem] whitespace-nowrap px-5 py-2"
              >
                {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
              </button>
            </div>
            <span
              className="block min-h-5 text-right text-sm leading-5 text-zinc-500"
              aria-live="polite"
            >
              {saveStatus ?? "\u00a0"}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mb-6 flex flex-wrap gap-1 border-b border-zinc-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={`rounded-2xl border border-zinc-200 bg-white shadow-sm ${tab === "builder" ? "p-4 lg:p-6" : "p-6"}`}>
        {tab === "builder" && (
          <FormBuilderTab
            draft={draft}
            update={update}
            orgId={orgId}
            locationId={id ?? null}
            library={library}
            onError={setError}
          />
        )}
        {tab === "media" && id && (
          <MediaLibraryTab
            locationId={id}
            draft={draft}
            orgId={orgId}
            library={library}
            onError={setError}
          />
        )}
        {tab === "theme" && (
          <ThemeTab draft={draft} update={update} orgId={orgId} onError={setError} />
        )}
        {tab === "embed" && <EmbedTab draft={draft} />}
        {tab === "advanced" && <AdvancedTab draft={draft} update={update} />}
      </div>
    </div>
  );
}
