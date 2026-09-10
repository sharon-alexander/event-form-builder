import type { StepId } from "../../../locations/types";
import type { EditableLocation } from "../../pages/FormEditorPage";

type OptionalFlag =
  | "show_multi_day_rental"
  | "show_additional_load_in_out"
  | "show_full_day_rental";

const OPTIONS: Partial<
  Record<StepId, { key: OptionalFlag; label: string; hint: string }[]>
> = {
  event_date: [
    {
      key: "show_multi_day_rental",
      label: "I'm also interested in a multi-day rental",
      hint: "Guests can check this. Starts unchecked.",
    },
  ],
  timing: [
    {
      key: "show_additional_load_in_out",
      label: "Additional load in/out time needed",
      hint: "Guests can check this. Starts unchecked.",
    },
    {
      key: "show_full_day_rental",
      label: "I'm also interested in a full-day rental",
      hint: "Guests can check this. Starts unchecked.",
    },
  ],
};

export default function OptionalCheckboxesEditor({
  stepId,
  draft,
  update,
}: {
  stepId: StepId;
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
}) {
  const options = OPTIONS[stepId];
  if (!options?.length) return null;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">Optional checkboxes</h3>
        <p className="mt-0.5 text-xs text-zinc-400">
          Add extra questions on this step. Hidden until you turn them on.
        </p>
      </div>
      {options.map((opt) => {
        const on = draft[opt.key];
        return (
          <div
            key={opt.key}
            className="flex items-start justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-zinc-900">{opt.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{opt.hint}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={opt.label}
              onClick={() => update({ [opt.key]: !on })}
              className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 ${
                on ? "bg-zinc-900" : "bg-zinc-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  on ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        );
      })}
    </section>
  );
}
