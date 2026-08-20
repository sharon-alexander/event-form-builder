import type { TimingStyle } from "../../../locations/types";
import type { EditableLocation } from "../../pages/FormEditorPage";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
}

const OPTIONS: { value: TimingStyle; label: string; hint: string }[] = [
  {
    value: "standard",
    label: "Start & end times",
    hint: "Guests pick preferred start and end times.",
  },
  {
    value: "meal_service",
    label: "Meal service",
    hint: "Guests pick a meal service (lunch/dinner) plus start time.",
  },
];

export default function TimingStyleEditor({ draft, update }: Props) {
  const current = (draft.timing_style || "standard") as TimingStyle;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">Timing style</h3>
        <p className="mt-0.5 text-xs text-zinc-400">
          Controls which timing questions guests see on this step.
        </p>
      </div>

      <div className="space-y-2">
        {OPTIONS.map((opt) => {
          const selected = current === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ timing_style: opt.value })}
              className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                selected
                  ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <p className="text-sm font-medium text-zinc-900">{opt.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{opt.hint}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
