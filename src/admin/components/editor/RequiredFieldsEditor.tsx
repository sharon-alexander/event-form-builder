import type { FieldId, StepId } from "../../../locations/types";
import { fieldsForStep, isFieldRequired } from "../../../form/fieldCatalog";
import type { EditableLocation } from "../../pages/FormEditorPage";

export default function RequiredFieldsEditor({
  stepId,
  draft,
  update,
}: {
  stepId: StepId;
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
}) {
  const fields = fieldsForStep(stepId);
  if (fields.length === 0) return null;

  const location = { requiredFields: draft.required_fields };

  function setRequired(fieldId: FieldId, required: boolean) {
    update({
      required_fields: {
        ...draft.required_fields,
        [fieldId]: required,
      },
    });
  }

  return (
    <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">Questions</h3>
        <p className="mt-0.5 text-xs text-zinc-400">
          Required questions must be answered before Continue. Optional questions
          still show on the form.
        </p>
      </div>

      <ul className="divide-y divide-zinc-100">
        {fields.map((field) => {
          const required = isFieldRequired(location, field.id);
          return (
            <li
              key={field.id}
              className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900">{field.label}</p>
                {field.locked && (
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Always required so we can send the inquiry.
                  </p>
                )}
              </div>
              {field.locked ? (
                <span className="mt-0.5 shrink-0 text-xs font-medium text-zinc-500">
                  Always required
                </span>
              ) : (
                <button
                  type="button"
                  role="switch"
                  aria-checked={required}
                  aria-label={`${field.label} required`}
                  onClick={() => setRequired(field.id, !required)}
                  className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 ${
                    required ? "bg-zinc-900" : "bg-zinc-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      required ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
