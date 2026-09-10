import type { TimingStyle } from "../../../locations/types";
import type { EditableLocation } from "../../pages/FormEditorPage";
import { fieldIsRequired, RequiredCheckbox, setFieldRequired } from "./RequiredCheckbox";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
}

const OPTIONS: { value: TimingStyle; label: string; hint: string }[] = [
  {
    value: "standard",
    label: "Start & end times",
    hint: "Start time and end time.",
  },
  {
    value: "meal_service",
    label: "Meal service",
    hint: "Lunch or dinner, plus a start time. No end time.",
  },
];

export default function TimingStyleEditor({ draft, update }: Props) {
  const current = (draft.timing_style || "standard") as TimingStyle;

  return (
    <section className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Timing</h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            Choose one. Guests see that version only.
          </p>
        </div>
        <RequiredCheckbox
          checked={fieldIsRequired(draft, "timing")}
          onChange={(required) =>
            setFieldRequired(draft, update, "timing", required)
          }
        />
      </div>

      <div role="radiogroup" aria-label="Timing questions" className="space-y-1.5">
        {OPTIONS.map((opt) => {
          const selected = current === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => update({ timing_style: opt.value })}
              className={`flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors ${
                selected
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <span
                className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                  selected ? "border-zinc-900" : "border-zinc-300"
                }`}
              >
                {selected && (
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
                )}
              </span>
              <span>
                <span className="block text-xs font-medium text-zinc-900">
                  {opt.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
                  {opt.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
