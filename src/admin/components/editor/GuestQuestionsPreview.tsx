import type { StepId } from "../../../locations/types";
import {
  EVENT_CATEGORIES,
  EVENT_FORMATS,
  REFERRAL_SOURCES,
  SERVICE_OPTIONS,
} from "../../../types";

type PreviewField = {
  label: string;
  kind: "choices" | "text" | "number" | "date" | "checkbox" | "textarea";
  options?: string[];
  optional?: boolean;
};

const PREVIEWS: Partial<Record<StepId, PreviewField[]>> = {
  event_type: [
    {
      label: "Booking type",
      kind: "choices",
      options: ["Private Event", "Large Party Booking"],
    },
  ],
  headcount: [
    { label: "Estimated headcount", kind: "number" },
    { label: "My headcount may change", kind: "checkbox", optional: true },
  ],
  event_format: [
    {
      label: "Event type",
      kind: "choices",
      options: EVENT_CATEGORIES.map((c) => c.label),
    },
    {
      label: "Format",
      kind: "choices",
      options: EVENT_FORMATS.map((f) => f.label),
    },
  ],
  event_date: [
    { label: "Event date", kind: "date" },
    { label: "Backup date", kind: "date", optional: true },
    { label: "My dates are flexible", kind: "checkbox", optional: true },
  ],
  services: [
    {
      label: "I am interested in…",
      kind: "choices",
      options: SERVICE_OPTIONS.map((s) => s.label),
    },
  ],
  other_venues_referral: [
    { label: "Considering any other venues?", kind: "choices", options: ["Yes", "No"] },
    {
      label: "How did you hear about us?",
      kind: "choices",
      options: REFERRAL_SOURCES.map((r) => r.label),
    },
  ],
  contact: [
    { label: "First name", kind: "text" },
    { label: "Last name", kind: "text" },
    { label: "Email", kind: "text" },
    { label: "Phone", kind: "text" },
    { label: "Company", kind: "text", optional: true },
    { label: "Preferred site visit dates", kind: "text", optional: true },
    { label: "Additional notes", kind: "textarea", optional: true },
    { label: "I'm submitting on behalf of a client", kind: "checkbox", optional: true },
  ],
};

export function hasGuestPreview(stepId: StepId): boolean {
  return stepId in PREVIEWS;
}

export default function GuestQuestionsPreview({ stepId }: { stepId: StepId }) {
  const fields = PREVIEWS[stepId];
  if (!fields) return null;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">What this step asks</h3>
        <p className="mt-0.5 text-xs text-zinc-400">
          These questions are the same on every form. Add an optional note at the
          bottom of this step if people need extra context.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
        {fields.map((field) => (
          <div key={field.label}>
            <p className="text-xs font-medium text-zinc-700">
              {field.label}
              {field.optional && (
                <span className="ml-1 font-normal text-zinc-400">(optional)</span>
              )}
            </p>
            {field.kind === "choices" && field.options ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {field.options.map((opt) => (
                  <span
                    key={opt}
                    className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-600"
                  >
                    {opt}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 rounded-md border border-dashed border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-400">
                {controlHint(field.kind)}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function controlHint(kind: PreviewField["kind"]): string {
  switch (kind) {
    case "number":
      return "Number field";
    case "date":
      return "Date picker";
    case "checkbox":
      return "Checkbox";
    case "textarea":
      return "Long text field";
    default:
      return "Text field";
  }
}
