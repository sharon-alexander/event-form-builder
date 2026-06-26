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
import type { EditableLocation } from "../../pages/FormEditorPage";
import { ALL_STEP_IDS, DEFAULT_FORM_STEPS, STEP_LABELS } from "../../constants/defaultFormSteps";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
}

export default function StepsTab({ draft, update }: Props) {
  const steps = draft.form_steps.length > 0 ? draft.form_steps : DEFAULT_FORM_STEPS;
  const moreDetails = draft.step_more_details ?? {};
  const availableToAdd = ALL_STEP_IDS.filter((id) => !steps.includes(id));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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
          <h2 className="text-sm font-semibold text-gray-900">Form steps</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Drag to reorder. Optional &quot;More Details&quot; text appears below each step on the
            public form.
          </p>
        </div>
        {availableToAdd.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              className="efb-input py-1.5 text-xs"
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={steps} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {steps.map((stepId, i) => (
              <SortableStepRow
                key={stepId}
                id={stepId}
                index={i}
                label={STEP_LABELS[stepId] ?? stepId}
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
  moreDetails,
  onMoreDetailsChange,
  onRemove,
}: {
  id: StepId;
  index: number;
  label: string;
  moreDetails: string;
  onMoreDetailsChange: (text: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
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
      className={`rounded-xl border border-slate-200 bg-white p-4 ${
        isDragging ? "z-10 shadow-lg ring-2 ring-brand-200" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label="Drag to reorder"
          className="mt-0.5 flex h-8 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md border border-slate-200 text-gray-400 hover:bg-slate-50 hover:text-gray-600 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripIcon />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-900">
              {index + 1}. {label}
            </p>
            <button
              type="button"
              onClick={onRemove}
              className="text-xs text-red-500 hover:text-red-600"
            >
              Remove
            </button>
          </div>
          <textarea
            className="efb-input mt-2 text-sm"
            rows={3}
            placeholder="Optional more details for this step…"
            value={moreDetails}
            onChange={(e) => onMoreDetailsChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function GripIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <circle cx="5" cy="4" r="1.25" />
      <circle cx="11" cy="4" r="1.25" />
      <circle cx="5" cy="8" r="1.25" />
      <circle cx="11" cy="8" r="1.25" />
      <circle cx="5" cy="12" r="1.25" />
      <circle cx="11" cy="12" r="1.25" />
    </svg>
  );
}
