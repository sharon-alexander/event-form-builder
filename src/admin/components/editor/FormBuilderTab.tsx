import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { StepId } from "../../../locations/types";
import { DEFAULT_STEP_COPY } from "../../../form/defaultStepCopy";
import { isEmptyRichText } from "../../../utils/richText";
import type { EditableLocation } from "../../pages/FormEditorPage";
import {
  ALL_STEP_IDS,
  DEFAULT_FORM_STEPS,
  STEP_LABELS,
} from "../../constants/defaultFormSteps";
import BudgetRangesEditor from "./BudgetRangesEditor";
import InfoPageEditor from "./InfoPageEditor";
import RichTextEditor from "./RichTextEditor";
import TimingStyleEditor from "./TimingStyleEditor";
import VenueSpacesEditor from "./VenueSpacesEditor";
import ContentTab from "./ContentTab";
import GalleryTab from "./GalleryTab";
import IframePreview from "./IframePreview";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
  orgId: string | null;
  onError: (msg: string) => void;
}

type Selection = "landing" | StepId;

type StepStatus =
  | { kind: "ok"; label: string }
  | { kind: "needs"; label: string }
  | null;

function stepStatus(stepId: StepId, draft: EditableLocation): StepStatus {
  switch (stepId) {
    case "venue_space": {
      const n = draft.venue_spaces.length;
      return n > 0
        ? { kind: "ok", label: `${n} space${n === 1 ? "" : "s"}` }
        : { kind: "needs", label: "Needs setup" };
    }
    case "budget": {
      const n = draft.budget_options.length;
      return n > 0
        ? { kind: "ok", label: `${n} range${n === 1 ? "" : "s"}` }
        : { kind: "needs", label: "Needs setup" };
    }
    case "timing":
      return draft.timing_style
        ? null
        : { kind: "needs", label: "Needs setup" };
    case "info_acknowledge": {
      const hasTitle = !!draft.info_page?.title.trim();
      const details = draft.step_more_details?.info_acknowledge ?? "";
      const hasDetails = !!details && !isEmptyRichText(details);
      return hasTitle || hasDetails
        ? { kind: "ok", label: "Configured" }
        : { kind: "needs", label: "Needs setup" };
    }
    default:
      return null;
  }
}

function needsSetupBanner(
  stepId: StepId,
  draft: EditableLocation,
): string | null {
  const status = stepStatus(stepId, draft);
  if (status?.kind !== "needs") return null;
  switch (stepId) {
    case "venue_space":
      return "No spaces yet. This step will look empty on the form until you add at least one.";
    case "budget":
      return "No budget ranges yet. This step will look empty on the form until you add at least one.";
    case "info_acknowledge":
      return "No info content yet. Add a title and details people should acknowledge.";
    default:
      return null;
  }
}

export default function FormBuilderTab({ draft, update, orgId, onError }: Props) {
  const steps =
    draft.form_steps.length > 0 ? draft.form_steps : DEFAULT_FORM_STEPS;
  const moreDetails = draft.step_more_details ?? {};
  const availableToAdd = ALL_STEP_IDS.filter((id) => !steps.includes(id));

  const [selectedId, setSelectedId] = useState<Selection>("landing");
  const [showConfig, setShowConfig] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (selectedId === "landing") return;
    if (!steps.includes(selectedId as StepId)) {
      setSelectedId(steps[0] ?? "landing");
      setShowConfig(false);
    }
  }, [steps, selectedId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function setSteps(next: StepId[]) {
    update({ form_steps: next });
  }

  function setMoreDetails(stepId: StepId, text: string) {
    update({
      step_more_details: {
        ...moreDetails,
        [stepId]: text,
      },
    });
  }

  function openConfig(id: Selection) {
    setSelectedId(id);
    setShowConfig(true);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = steps.indexOf(active.id as StepId);
    const newIndex = steps.indexOf(over.id as StepId);
    if (oldIndex === -1 || newIndex === -1) return;
    setSteps(arrayMove(steps, oldIndex, newIndex));
    setShowConfig(false);
  }

  function removeStep(index: number) {
    const removed = steps[index];
    const next = steps.filter((_, i) => i !== index);
    setSteps(next);
    setShowConfig(false);
    if (removed === selectedId) {
      setSelectedId(next[Math.min(index, next.length - 1)] ?? "landing");
    }
  }

  function addStep(stepId: StepId) {
    setSteps([...steps, stepId]);
    setSelectedId(stepId);
    setShowConfig(false);
  }

  return (
    <div className="space-y-4 lg:space-y-0 lg:flex lg:gap-6">
      {/* Left: Preview (desktop) */}
      <div className="hidden w-[55%] shrink-0 lg:block">
        <div className="sticky top-6">
          <IframePreview draft={draft} selectedId={selectedId} />
        </div>
      </div>

      {/* Right: Navigation OR Config */}
      <div className="min-w-0 flex-1 space-y-5">
        {/* Mobile preview toggle */}
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="adm-btn-secondary w-full py-2 text-xs"
          >
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
          {showPreview && (
            <div className="mt-3">
              <IframePreview draft={draft} selectedId={selectedId} />
            </div>
          )}
        </div>

        {showConfig ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
            >
              <BackIcon />
              All steps
            </button>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5">
              {selectedId === "landing" ? (
                <LandingConfig
                  draft={draft}
                  update={update}
                  orgId={orgId}
                  onError={onError}
                />
              ) : (
                <StepConfig
                  stepId={selectedId}
                  steps={steps}
                  draft={draft}
                  update={update}
                  orgId={orgId}
                  onError={onError}
                  moreDetails={moreDetails}
                  setMoreDetails={setMoreDetails}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="overflow-hidden rounded-xl border border-zinc-200">
              <button
                type="button"
                onClick={() => openConfig("landing")}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                  selectedId === "landing"
                    ? "bg-zinc-900 text-white"
                    : "bg-white hover:bg-zinc-50"
                }`}
              >
                <LandingIcon selected={selectedId === "landing"} />
                <div>
                  <p
                    className={`text-sm font-medium ${selectedId === "landing" ? "text-white" : "text-zinc-900"}`}
                  >
                    Landing Page
                  </p>
                  <p className="text-xs text-zinc-400">
                    Hero, name, and about copy
                  </p>
                </div>
              </button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={steps}
                strategy={verticalListSortingStrategy}
              >
                <div className="overflow-hidden rounded-xl border border-zinc-200 divide-y divide-zinc-100">
                  {steps.map((stepId, i) => (
                    <SortableStepRow
                      key={stepId}
                      id={stepId}
                      index={i}
                      label={STEP_LABELS[stepId] ?? stepId}
                      subtitle={DEFAULT_STEP_COPY[stepId]?.subtitle}
                      status={stepStatus(stepId, draft)}
                      selected={selectedId === stepId}
                      onSelect={() => openConfig(stepId)}
                      onRemove={() => removeStep(i)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {availableToAdd.length > 0 && (
              <AddStepPicker available={availableToAdd} onAdd={addStep} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Landing config ──────────────────────────────────────────────────────────

function LandingConfig({
  draft,
  update,
  orgId,
  onError,
}: {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
  orgId: string | null;
  onError: (msg: string) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">Landing Page</h3>
        <p className="mt-0.5 text-xs text-zinc-400">
          Shown before the form starts — venue name, about copy, and hero
          gallery.
        </p>
      </div>
      <ContentTab draft={draft} update={update} />
      <hr className="border-zinc-100" />
      <GalleryTab draft={draft} update={update} orgId={orgId} onError={onError} />
    </div>
  );
}

// ── Step config ─────────────────────────────────────────────────────────────

function StepConfig({
  stepId,
  steps,
  draft,
  update,
  orgId,
  onError,
  moreDetails,
  setMoreDetails,
}: {
  stepId: StepId;
  steps: StepId[];
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
  orgId: string | null;
  onError: (msg: string) => void;
  moreDetails: Partial<Record<StepId, string>>;
  setMoreDetails: (stepId: StepId, text: string) => void;
}) {
  const selectedCopy = DEFAULT_STEP_COPY[stepId];
  const banner = needsSetupBanner(stepId, draft);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Step {steps.indexOf(stepId) + 1}
        </p>
        <h3 className="mt-1 text-base font-semibold text-zinc-900">
          {STEP_LABELS[stepId]}
        </h3>
        {selectedCopy?.subtitle && (
          <p className="mt-1 text-sm text-zinc-500">{selectedCopy.subtitle}</p>
        )}
      </div>

      {banner && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {banner}
        </p>
      )}

      {stepId === "venue_space" && (
        <VenueSpacesEditor
          draft={draft}
          update={update}
          orgId={orgId}
          onError={onError}
        />
      )}
      {stepId === "budget" && (
        <BudgetRangesEditor draft={draft} update={update} />
      )}
      {stepId === "timing" && (
        <TimingStyleEditor draft={draft} update={update} />
      )}
      {stepId === "info_acknowledge" && (
        <InfoPageEditor draft={draft} update={update} />
      )}

      <StepNoteEditor
        value={moreDetails[stepId] ?? ""}
        onChange={(text) => setMoreDetails(stepId, text)}
        showDetailsHeading={stepId !== "info_acknowledge"}
        hint={
          stepId === "info_acknowledge"
            ? "Shown above the I Understand button. Supports bold, bullets, and numbered lists."
            : undefined
        }
      />
    </div>
  );
}

// ── Step note editor ────────────────────────────────────────────────────────

function StepNoteEditor({
  value,
  onChange,
  hint,
}: {
  value: string;
  onChange: (text: string) => void;
  showDetailsHeading?: boolean;
  hint?: string;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">Extra Info</h3>
        <p className="mt-0.5 text-xs text-zinc-400">
          {hint ??
            "Optional. Shown on the form as extra details for this step. Supports bold, bullets, and numbered lists."}
        </p>
      </div>

      <RichTextEditor
        id="step-more-details"
        value={value}
        onChange={onChange}
        placeholder='e.g. "Parking is available on 12th Street."'
      />
    </section>
  );
}

// ── Add step picker ─────────────────────────────────────────────────────────

function AddStepPicker({
  available,
  onAdd,
}: {
  available: StepId[];
  onAdd: (id: StepId) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-3 py-2.5 text-sm font-medium transition-colors ${
          open
            ? "border-zinc-400 bg-zinc-50 text-zinc-900"
            : "border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-800"
        }`}
      >
        <span className="text-base leading-none">+</span>
        Add a step
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Available steps"
          className="absolute bottom-full left-0 right-0 z-20 mb-1.5 max-h-80 overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
        >
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            Choose a question to add
          </p>
          {available.map((id) => {
            const copy = DEFAULT_STEP_COPY[id];
            return (
              <button
                key={id}
                type="button"
                role="option"
                className="flex w-full flex-col px-3 py-2 text-left hover:bg-zinc-50"
                onClick={() => {
                  onAdd(id);
                  setOpen(false);
                }}
              >
                <span className="text-sm font-medium text-zinc-900">
                  {STEP_LABELS[id]}
                </span>
                {copy.subtitle && (
                  <span className="mt-0.5 text-xs text-zinc-400">
                    {copy.subtitle}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sortable step row ───────────────────────────────────────────────────────

function SortableStepRow({
  id,
  index,
  label,
  subtitle,
  status,
  selected,
  onSelect,
  onRemove,
}: {
  id: StepId;
  index: number;
  label: string;
  subtitle?: string;
  status: StepStatus;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-1 bg-white px-1.5 py-1.5 ${
        isDragging
          ? "relative z-10 shadow-md ring-1 ring-zinc-200"
          : selected
            ? "bg-zinc-50"
            : ""
      }`}
    >
      <button
        type="button"
        aria-label="Reorder step"
        className="mt-1.5 flex h-8 w-7 shrink-0 cursor-grab items-center justify-center rounded-md text-zinc-300 hover:bg-zinc-50 hover:text-zinc-500 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripIcon />
      </button>

      <button
        type="button"
        onClick={onSelect}
        className={`flex min-w-0 flex-1 items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
          selected ? "bg-zinc-900 text-white" : "hover:bg-zinc-50"
        }`}
      >
        <span
          className={`mt-0.5 w-5 shrink-0 text-center text-xs font-medium tabular-nums ${
            selected ? "text-zinc-400" : "text-zinc-400"
          }`}
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-medium ${selected ? "text-white" : "text-zinc-900"}`}
          >
            {label}
          </p>
          {subtitle && (
            <p
              className={`mt-0.5 line-clamp-1 text-xs ${
                selected ? "text-zinc-400" : "text-zinc-400"
              }`}
            >
              {subtitle}
            </p>
          )}
          {status && (
            <span
              className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                status.kind === "needs"
                  ? selected
                    ? "bg-amber-500/20 text-amber-200"
                    : "bg-amber-50 text-amber-700"
                  : selected
                    ? "bg-white/10 text-zinc-300"
                    : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {status.label}
            </span>
          )}
        </div>
      </button>

      <button
        type="button"
        aria-label="Remove step"
        onClick={onRemove}
        className="mt-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-500"
      >
        <TrashIcon />
      </button>
    </div>
  );
}

// ── Icons ───────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 19.5L8.25 12l7.5-7.5"
      />
    </svg>
  );
}

function LandingIcon({ selected }: { selected: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 ${selected ? "text-zinc-400" : "text-zinc-400"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  );
}

function GripIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path d="M7 4a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm9-12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}

function TrashIcon() {
  return (
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
  );
}
