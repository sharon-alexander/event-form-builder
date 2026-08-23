import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
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
import type { BudgetOption } from "../../../locations/types";
import type { EditableLocation } from "../../pages/FormEditorPage";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
}

const COMMON_BUDGET_RANGES: BudgetOption[] = [
  { value: "under_5k", label: "Less than $5,000" },
  { value: "5k_10k", label: "$5,000 – $10,000" },
  { value: "10k_15k", label: "$10,000 – $15,000" },
  { value: "15k_plus", label: "$15,000+" },
];

function slugifyValue(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function withGeneratedValues(items: BudgetOption[]): BudgetOption[] {
  return items.map((item, i) => ({
    ...item,
    value: item.value || slugifyValue(item.label) || `option_${i + 1}`,
  }));
}

function newId(): string {
  return crypto.randomUUID();
}

export default function BudgetRangesEditor({ draft, update }: Props) {
  const budgets = draft.budget_options;

  const [budgetIds, setBudgetIds] = useState(() => budgets.map(newId));
  const [focusId, setFocusId] = useState<string | null>(null);
  const focusRef = useRef<HTMLInputElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (!focusId) return;
    focusRef.current?.focus();
    setFocusId(null);
  }, [focusId, budgets]);

  useEffect(() => {
    setBudgetIds((prev) => {
      if (prev.length === budgets.length) return prev;
      if (budgets.length > prev.length) {
        return [...prev, ...Array.from({ length: budgets.length - prev.length }, newId)];
      }
      return prev.slice(0, budgets.length);
    });
  }, [budgets.length]);

  function setBudgets(next: BudgetOption[], nextIds?: string[]) {
    if (nextIds) setBudgetIds(nextIds);
    update({ budget_options: withGeneratedValues(next) });
  }

  function addBudget(budget: BudgetOption = { value: "", label: "" }) {
    const id = newId();
    setBudgets([...budgets, budget], [...budgetIds, id]);
    setFocusId(id);
  }

  function handleBudgetDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = budgetIds.indexOf(active.id as string);
    const newIndex = budgetIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    setBudgets(arrayMove(budgets, oldIndex, newIndex), arrayMove(budgetIds, oldIndex, newIndex));
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Budget ranges</h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            Options people pick on this step.
          </p>
        </div>
        {budgets.length > 0 && (
          <button
            type="button"
            className="adm-btn-secondary shrink-0 px-3 py-1.5 text-xs"
            onClick={() => addBudget()}
          >
            Add range
          </button>
        )}
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          title="No ranges yet"
          primaryLabel="Add range"
          onPrimary={() => addBudget()}
          secondaryLabel="Use common ranges"
          onSecondary={() => {
            const ids = COMMON_BUDGET_RANGES.map(newId);
            setBudgets(COMMON_BUDGET_RANGES, ids);
            const firstId = ids[0];
            if (firstId) setFocusId(firstId);
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {budgets.map((budget, i) => (
              <div
                key={budgetIds[i] ?? `budget-preview-${i}`}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-center text-xs font-medium text-zinc-700"
              >
                {budget.label.trim() || "Untitled range"}
              </div>
            ))}
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleBudgetDragEnd}
          >
            <SortableContext items={budgetIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {budgets.map((budget, i) => {
                  const id = budgetIds[i];
                  if (!id) return null;
                  return (
                    <SortableBudgetRow
                      key={id}
                      id={id}
                      index={i}
                      budget={budget}
                      inputRef={focusId === id ? focusRef : undefined}
                      onChange={(label) =>
                        setBudgets(
                          budgets.map((row, idx) => (idx === i ? { ...row, label } : row)),
                        )
                      }
                      onRemove={() =>
                        setBudgets(
                          budgets.filter((_, idx) => idx !== i),
                          budgetIds.filter((_, idx) => idx !== i),
                        )
                      }
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </section>
  );
}

function SortableBudgetRow({
  id,
  index,
  budget,
  inputRef,
  onChange,
  onRemove,
}: {
  id: string;
  index: number;
  budget: BudgetOption;
  inputRef?: Ref<HTMLInputElement>;
  onChange: (label: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-start gap-2 rounded-xl border border-zinc-200 bg-white p-3 ${
        isDragging ? "relative z-10 shadow-md ring-1 ring-zinc-200" : ""
      }`}
    >
      <button
        type="button"
        aria-label="Reorder range"
        className="mt-6 flex h-9 w-7 shrink-0 cursor-grab items-center justify-center rounded-md text-zinc-300 hover:bg-zinc-50 hover:text-zinc-500 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripIcon />
      </button>
      <span className="mt-8 w-5 shrink-0 text-center text-xs font-medium tabular-nums text-zinc-400">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <label className="adm-label" htmlFor={`budget-label-${id}`}>
          Range label
        </label>
        <input
          id={`budget-label-${id}`}
          ref={inputRef}
          className="adm-input py-2"
          placeholder="e.g. $5,000 – $10,000"
          value={budget.label}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <IconButton label="Remove" onClick={onRemove} destructive>
        <TrashIcon />
      </IconButton>
    </div>
  );
}

function EmptyState({
  title,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  title: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-zinc-300 px-6 py-10 text-center">
      <p className="text-sm font-medium text-zinc-800">{title}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button type="button" className="adm-btn-primary px-4 py-2 text-xs" onClick={onPrimary}>
          {primaryLabel}
        </button>
        <button type="button" className="adm-btn-secondary px-4 py-2 text-xs" onClick={onSecondary}>
          {secondaryLabel}
        </button>
      </div>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  destructive,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`mt-6 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors ${
        destructive
          ? "border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
          : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
      }`}
    >
      {children}
    </button>
  );
}

function GripIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M7 4a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm9-12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
