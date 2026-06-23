import type { BudgetOption, VenueSpaceOption } from "../../../locations/types";
import type { EditableLocation } from "../../pages/FormEditorPage";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
}

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

export default function OptionsTab({ draft, update }: Props) {
  const venues = draft.venue_spaces;
  const budgets = draft.budget_options;

  function setVenues(next: VenueSpaceOption[]) {
    update({ venue_spaces: withGeneratedValues(next) });
  }
  function setBudgets(next: BudgetOption[]) {
    update({ budget_options: withGeneratedValues(next) });
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Venue spaces</h2>
            <p className="mt-0.5 text-xs text-gray-400">
              Options shown on the venue selection step, with starting prices.
            </p>
          </div>
          <button
            type="button"
            className="efb-btn-secondary px-3 py-1.5 text-xs"
            onClick={() =>
              setVenues([...venues, { value: "", label: "", price: "" }])
            }
          >
            Add space
          </button>
        </div>

        <div className="space-y-2">
          {venues.map((v, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
            >
              <input
                className="efb-input min-w-0 flex-1 py-2"
                placeholder="Name (e.g. 1st Floor Salon)"
                value={v.label}
                onChange={(e) => {
                  const label = e.target.value;
                  setVenues(
                    venues.map((row, idx) =>
                      idx === i ? { ...row, label } : row,
                    ),
                  );
                }}
              />
              <input
                className="efb-input min-w-0 flex-1 py-2"
                placeholder="Price (e.g. Starting at $3,000)"
                value={v.price}
                onChange={(e) =>
                  setVenues(
                    venues.map((row, idx) =>
                      idx === i ? { ...row, price: e.target.value } : row,
                    ),
                  )
                }
              />
              <IconButton label="Remove" onClick={() => setVenues(venues.filter((_, idx) => idx !== i))} destructive>
                <TrashIcon />
              </IconButton>
            </div>
          ))}
          {venues.length === 0 && <EmptyHint label="venue spaces" />}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Budget ranges</h2>
            <p className="mt-0.5 text-xs text-gray-400">
              Options shown on the budget step.
            </p>
          </div>
          <button
            type="button"
            className="efb-btn-secondary px-3 py-1.5 text-xs"
            onClick={() => setBudgets([...budgets, { value: "", label: "" }])}
          >
            Add range
          </button>
        </div>

        <div className="space-y-2">
          {budgets.map((b, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
            >
              <input
                className="efb-input min-w-0 flex-1 py-2"
                placeholder="Label (e.g. $5,000 – $7,000)"
                value={b.label}
                onChange={(e) => {
                  const label = e.target.value;
                  setBudgets(
                    budgets.map((row, idx) =>
                      idx === i ? { ...row, label } : row,
                    ),
                  );
                }}
              />
              <IconButton label="Remove" onClick={() => setBudgets(budgets.filter((_, idx) => idx !== i))} destructive>
                <TrashIcon />
              </IconButton>
            </div>
          ))}
          {budgets.length === 0 && <EmptyHint label="budget ranges" />}
        </div>
      </section>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  destructive,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors ${
        destructive
          ? "border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
          : "border-slate-200 text-gray-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
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

function EmptyHint({ label }: { label: string }) {
  return <p className="text-xs text-gray-400">No {label} yet.</p>;
}
