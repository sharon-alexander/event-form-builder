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

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
}

export default function StepsTab({ draft, update }: Props) {
  const steps =
    draft.form_steps.length > 0 ? draft.form_steps : DEFAULT_FORM_STEPS;
  const moreDetails = draft.step_more_details ?? {};
  const availableToAdd = ALL_STEP_IDS.filter((id) => !steps.includes(id));

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
    setSteps(steps.filter((_, i) => i !== index));
  }

  function addStep(stepId: StepId) {
    setSteps([...steps, stepId]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Form steps</h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Drag a row to reorder. The subtitle already shows on the form — use
            more details only for extra info.
          </p>
        </div>
        {availableToAdd.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              className="adm-input py-1.5 text-xs"
              defaultValue=""
              onChange={(e) => {
                const value = e.target.value as StepId;
                if (value) addStep(value);
                e.target.value = "";
              }}
            >
              <option value="" disabled>
                Add step…
              </option>
              {availableToAdd.map((id) => (
                <option key={id} value={id}>
                  {STEP_LABELS[id]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={steps} strategy={verticalListSortingStrategy}>
          <div className="overflow-hidden rounded-xl border border-zinc-200 divide-y divide-zinc-100">
            {steps.map((stepId, i) => (
              <SortableStepRow
                key={stepId}
                id={stepId}
                index={i}
                label={STEP_LABELS[stepId] ?? stepId}
                subtitle={DEFAULT_STEP_COPY[stepId]?.subtitle}
                moreDetails={moreDetails[stepId] ?? ""}
                onMoreDetailsChange={(text) => setMoreDetails(stepId, text)}
                onRemove={() => removeStep(i)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableStepRow({
  id,
  index,
  label,
  subtitle,
  moreDetails,
  onMoreDetailsChange,
  onRemove,
}: {
  id: StepId;
  index: number;
  label: string;
  subtitle?: string;
  moreDetails: string;
  onMoreDetailsChange: (text: string) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-3 bg-white px-3 py-2.5 touch-none select-none ${
        isDragging
          ? "relative z-10 cursor-grabbing bg-zinc-50 shadow-md ring-1 ring-zinc-200"
          : "cursor-grab"
      }`}
      {...attributes}
      {...listeners}
    >
      <span className="mt-0.5 w-5 shrink-0 text-center text-xs font-medium tabular-nums text-zinc-400">
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-900">{label}</p>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>}
        <input
          className="mt-1.5 w-full rounded-md border border-zinc-100 bg-zinc-50/80 px-2 py-1.5 text-xs text-zinc-600 placeholder:text-zinc-300 focus:border-zinc-200 focus:bg-white focus:outline-none focus:ring-0"
          placeholder="Optional more details"
          value={moreDetails}
          onChange={(e) => onMoreDetailsChange(e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        />
      </div>

      <button
        type="button"
        aria-label="Remove step"
        onClick={onRemove}
        onPointerDown={(e) => e.stopPropagation()}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-500"
      >
        <TrashIcon />
      </button>
    </div>
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
