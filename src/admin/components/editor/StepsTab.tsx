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
import type { EditableLocation } from "../../pages/FormEditorPage";
import {
  ALL_STEP_IDS,
  DEFAULT_FORM_STEPS,
  STEP_LABELS,
} from "../../constants/defaultFormSteps";
import BudgetRangesEditor from "./BudgetRangesEditor";
import GuestQuestionsPreview, {
  hasGuestPreview,
} from "./GuestQuestionsPreview";
import InfoPageEditor from "./InfoPageEditor";
import TimingStyleEditor from "./TimingStyleEditor";
import VenueSpacesEditor from "./VenueSpacesEditor";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
  orgId: string | null;
  onError: (msg: string) => void;
}

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
      const page = draft.info_page;
      const hasContent =
        !!page &&
        (!!page.title.trim() ||
          !!page.intro?.trim() ||
          (page.sections?.length ?? 0) > 0);
      return hasContent
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

export default function StepsTab({ draft, update, orgId, onError }: Props) {
  const steps =
    draft.form_steps.length > 0 ? draft.form_steps : DEFAULT_FORM_STEPS;
  const moreDetails = draft.step_more_details ?? {};
  const availableToAdd = ALL_STEP_IDS.filter((id) => !steps.includes(id));

  const [selectedId, setSelectedId] = useState<StepId | null>(steps[0] ?? null);

  useEffect(() => {
    if (steps.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !steps.includes(selectedId)) {
      setSelectedId(steps[0] ?? null);
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.indexOf(active.id as StepId);
    const newIndex = steps.indexOf(over.id as StepId);
    if (oldIndex === -1 || newIndex === -1) return;

    setSteps(arrayMove(steps, oldIndex, newIndex));
  }

  function removeStep(index: number) {
    const removed = steps[index];
    const next = steps.filter((_, i) => i !== index);
    setSteps(next);
    if (removed === selectedId) {
      setSelectedId(next[Math.min(index, next.length - 1)] ?? null);
    }
  }

  function addStep(stepId: StepId) {
    setSteps([...steps, stepId]);
    setSelectedId(stepId);
  }

  const selectedCopy = selectedId ? DEFAULT_STEP_COPY[selectedId] : null;
  const banner = selectedId ? needsSetupBanner(selectedId, draft) : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900">Form steps</h2>
        <p className="mt-0.5 text-xs text-zinc-400">
          Form questions in order. Select a step to configure it.
        </p>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="w-full shrink-0 space-y-2 lg:w-64 xl:w-72">
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
                    onSelect={() => setSelectedId(stepId)}
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

        {/* Detail pane */}
        <div className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50/50 p-5">
          {!selectedId || !selectedCopy ? (
            <p className="text-sm text-zinc-400">Select a step to edit.</p>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Step {steps.indexOf(selectedId) + 1}
                </p>
                <h3 className="mt-1 text-base font-semibold text-zinc-900">
                  {STEP_LABELS[selectedId]}
                </h3>
                {selectedCopy.subtitle && (
                  <p className="mt-1 text-sm text-zinc-500">
                    {selectedCopy.subtitle}
                  </p>
                )}
              </div>

              {banner && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {banner}
                </p>
              )}

              {hasGuestPreview(selectedId) && (
                <GuestQuestionsPreview stepId={selectedId} />
              )}
              {selectedId === "venue_space" && (
                <VenueSpacesEditor
                  draft={draft}
                  update={update}
                  orgId={orgId}
                  onError={onError}
                />
              )}
              {selectedId === "budget" && (
                <BudgetRangesEditor draft={draft} update={update} />
              )}
              {selectedId === "timing" && (
                <TimingStyleEditor draft={draft} update={update} />
              )}
              {selectedId === "info_acknowledge" && (
                <InfoPageEditor draft={draft} update={update} />
              )}

              {selectedId !== "info_acknowledge" && (
                <StepNoteEditor
                  value={moreDetails[selectedId] ?? ""}
                  onChange={(text) => setMoreDetails(selectedId, text)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepNoteEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (text: string) => void;
}) {
  const trimmed = value.trim();

  return (
    <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">Extra Info</h3>
        <p className="mt-0.5 text-xs text-zinc-400">
          Optional. Shown under a{" "}
          <span className="font-medium text-zinc-500">More Details</span>{" "}
          heading after the questions on this step.
        </p>
      </div>

      <textarea
        id="step-more-details"
        rows={4}
        className="adm-input resize-y"
        placeholder='e.g. "Parking is available on 12th Street."'
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {trimmed ? (
        <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/80 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            Form preview
          </p>
          <div className="mt-2 border-t border-zinc-200 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              More Details
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-zinc-600">
              {value}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

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
          className="absolute bottom-full left-0 right-0 z-20 mb-1.5 max-h-80 overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg lg:bottom-auto lg:left-full lg:right-auto lg:top-0 lg:mb-0 lg:ml-2 lg:w-80"
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
