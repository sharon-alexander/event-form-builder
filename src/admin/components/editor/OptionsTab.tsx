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
import type { BudgetOption, VenueSpaceOption } from "../../../locations/types";
import type { EditableLocation } from "../../pages/FormEditorPage";
import { collectFormMedia } from "../../utils/formMediaLibrary";
import VenueGalleryEditor from "./VenueGalleryEditor";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
  orgId: string | null;
  onError: (msg: string) => void;
}

const COMMON_BUDGET_RANGES: BudgetOption[] = [
  { value: "under_5k", label: "Less than $5,000" },
  { value: "5k_10k", label: "$5,000 – $10,000" },
  { value: "10k_15k", label: "$10,000 – $15,000" },
  { value: "15k_plus", label: "$15,000+" },
];

const NOT_SURE_SPACE: VenueSpaceOption = {
  value: "not_sure",
  label: "Not Sure Yet",
  price: "We'll help you decide",
};

type SubTab = "spaces" | "budgets";

function slugifyValue(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Ensure every option has an internal value derived from its label. */
function withGeneratedValues<T extends { value: string; label: string }>(
  items: T[],
): T[] {
  return items.map((item, i) => ({
    ...item,
    value: item.value || slugifyValue(item.label) || `option_${i + 1}`,
  }));
}

function newId(): string {
  return crypto.randomUUID();
}

export default function OptionsTab({ draft, update, orgId, onError }: Props) {
  const venues = draft.venue_spaces;
  const budgets = draft.budget_options;
  const libraryMedia = collectFormMedia(draft);

  const [subTab, setSubTab] = useState<SubTab>("spaces");
  const [spaceIds, setSpaceIds] = useState(() => venues.map(newId));
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
  }, [focusId, venues, budgets]);

  function setVenues(next: VenueSpaceOption[], nextIds?: string[]) {
    if (nextIds) setSpaceIds(nextIds);
    update({ venue_spaces: withGeneratedValues(next) });
  }

  function setBudgets(next: BudgetOption[], nextIds?: string[]) {
    if (nextIds) setBudgetIds(nextIds);
    update({ budget_options: withGeneratedValues(next) });
  }

  function addSpace(space: VenueSpaceOption = { value: "", label: "", price: "" }) {
    const id = newId();
    setVenues([...venues, space], [...spaceIds, id]);
    setFocusId(id);
  }

  function addBudget(budget: BudgetOption = { value: "", label: "" }) {
    const id = newId();
    setBudgets([...budgets, budget], [...budgetIds, id]);
    setFocusId(id);
  }

  function handleSpaceDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = spaceIds.indexOf(active.id as string);
    const newIndex = spaceIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    setVenues(arrayMove(venues, oldIndex, newIndex), arrayMove(spaceIds, oldIndex, newIndex));
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
    <div className="space-y-5">
      <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 w-fit">
        {(
          [
            { id: "spaces", label: `Spaces (${venues.length})` },
            { id: "budgets", label: `Budgets (${budgets.length})` },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSubTab(id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              subTab === id
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {subTab === "spaces" ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-zinc-900">Spaces</h2>
            {venues.length > 0 && (
              <button
                type="button"
                className="adm-btn-secondary shrink-0 px-3 py-1.5 text-xs"
                onClick={() => addSpace()}
              >
                Add space
              </button>
            )}
          </div>

          {venues.length === 0 ? (
            <EmptyState
              title="No spaces yet"
              primaryLabel="Add space"
              onPrimary={() => addSpace()}
              secondaryLabel="Add “Not sure yet”"
              onSecondary={() => addSpace(NOT_SURE_SPACE)}
            />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSpaceDragEnd}
            >
              <SortableContext items={spaceIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {venues.map((venue, i) => {
                    const id = spaceIds[i];
                    if (!id) return null;
                    return (
                      <SortableSpaceCard
                        key={id}
                        id={id}
                        index={i}
                        venue={venue}
                        inputRef={focusId === id ? focusRef : undefined}
                        libraryMedia={libraryMedia}
                        orgId={orgId}
                        slug={draft.slug}
                        onError={onError}
                        onChange={(patch) =>
                          setVenues(
                            venues.map((row, idx) => (idx === i ? { ...row, ...patch } : row)),
                          )
                        }
                        onRemove={() =>
                          setVenues(
                            venues.filter((_, idx) => idx !== i),
                            spaceIds.filter((_, idx) => idx !== i),
                          )
                        }
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-zinc-900">Budget ranges</h2>
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
      )}
    </div>
  );
}

function SortableSpaceCard({
  id,
  index,
  venue,
  inputRef,
  libraryMedia,
  orgId,
  slug,
  onError,
  onChange,
  onRemove,
}: {
  id: string;
  index: number;
  venue: VenueSpaceOption;
  inputRef?: Ref<HTMLInputElement>;
  libraryMedia: ReturnType<typeof collectFormMedia>;
  orgId: string | null;
  slug: string;
  onError: (msg: string) => void;
  onChange: (patch: Partial<VenueSpaceOption>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const media = venue.galleryMedia ?? [];
  const preview = media[0];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-xl border border-zinc-200 bg-white p-3 ${
        isDragging ? "relative z-10 shadow-md ring-1 ring-zinc-200" : ""
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <GuestCardPreview
          label={venue.label}
          price={venue.price}
          preview={preview}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <button
              type="button"
              aria-label="Reorder space"
              className="mt-6 flex h-9 w-7 shrink-0 cursor-grab items-center justify-center rounded-md text-zinc-300 hover:bg-zinc-50 hover:text-zinc-500 active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripIcon />
            </button>
            <span className="mt-8 w-5 shrink-0 text-center text-xs font-medium tabular-nums text-zinc-400">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <label className="adm-label" htmlFor={`space-name-${id}`}>
                  Space name
                </label>
                <input
                  id={`space-name-${id}`}
                  ref={inputRef}
                  className="adm-input py-2"
                  placeholder="e.g. 1st Floor Salon"
                  value={venue.label}
                  onChange={(e) => onChange({ label: e.target.value })}
                />
              </div>
              <div>
                <label className="adm-label" htmlFor={`space-price-${id}`}>
                  Starting price
                </label>
                <input
                  id={`space-price-${id}`}
                  className="adm-input py-2"
                  placeholder="e.g. Starting at $3,000"
                  value={venue.price}
                  onChange={(e) => onChange({ price: e.target.value })}
                />
              </div>
            </div>
            <IconButton label="Remove" onClick={onRemove} destructive>
              <TrashIcon />
            </IconButton>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <VenueGalleryEditor
          media={media}
          libraryMedia={libraryMedia}
          onChange={(galleryMedia) => onChange({ galleryMedia })}
          orgId={orgId}
          slug={slug}
          onError={onError}
        />
      </div>
    </div>
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

function GuestCardPreview({
  label,
  price,
  preview,
}: {
  label: string;
  price: string;
  preview?: { type: string; src: string; poster?: string; alt: string };
}) {
  const src =
    preview && (preview.type === "video" ? (preview.poster ?? preview.src) : preview.src);

  return (
    <div className="w-full shrink-0 rounded-lg border border-zinc-200 bg-white p-2 sm:w-36">
      <div className="mb-2 h-20 overflow-hidden rounded-md bg-zinc-100">
        {src ? (
          <img src={src} alt={preview?.alt ?? ""} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center border border-dashed border-zinc-200 text-[10px] text-zinc-400">
            No photo
          </div>
        )}
      </div>
      <p className="text-xs font-semibold text-zinc-900">
        {label.trim() || "Untitled space"}
      </p>
      {price.trim() ? <p className="mt-0.5 text-[10px] text-zinc-500">{price}</p> : null}
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
