import type { StepId } from "../../../locations/types";
import type { EditableLocation } from "../../pages/FormEditorPage";

type OptionalFlag =
  | "show_multi_day_rental"
  | "show_additional_load_in_out"
  | "show_full_day_rental";

const OPTIONS: Partial<Record<StepId, { key: OptionalFlag; label: string }[]>> = {
  event_date: [
    {
      key: "show_multi_day_rental",
      label: "I'm also interested in a multi-day rental",
    },
  ],
  timing: [
    {
      key: "show_additional_load_in_out",
      label: "Additional load in/out time needed",
    },
    {
      key: "show_full_day_rental",
      label: "I'm also interested in a full-day rental",
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
    <section className="space-y-1.5">
      <h3 className="text-xs font-semibold text-zinc-900">Optional checkboxes</h3>
      {options.map((opt) => {
        const on = draft[opt.key];
        return (
          <div key={opt.key} className="flex items-center justify-between gap-3">
            <p className="text-xs text-zinc-700">{opt.label}</p>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={opt.label}
              onClick={() => update({ [opt.key]: !on })}
              className={`relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 ${
                on ? "bg-zinc-900" : "bg-zinc-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${
                  on ? "translate-x-3" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        );
      })}
    </section>
  );
}
