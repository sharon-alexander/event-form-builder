import type { FieldId, StepId } from "../../../locations/types";
import { fieldsForStep } from "../../../form/fieldCatalog";
import type { EditableLocation } from "../../pages/FormEditorPage";
import {
  fieldIsRequired,
  RequiredCheckbox,
  setFieldRequired,
} from "./RequiredCheckbox";

/** Shown on the step’s own editor heading instead of this list. */
const INLINE_FIELDS: Partial<Record<StepId, FieldId[]>> = {
  venue_space: ["venueSpace"],
  budget: ["budget"],
  event_format: ["eventCategory", "eventFormat"],
  timing: ["timing"],
  info_acknowledge: ["infoAcknowledged"],
};

export default function RequiredFieldsEditor({
  stepId,
  draft,
  update,
}: {
  stepId: StepId;
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
}) {
  const inline = new Set(INLINE_FIELDS[stepId] ?? []);
  const fields = fieldsForStep(stepId).filter((field) => !inline.has(field.id));
  if (fields.length === 0) return null;

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <div key={field.id} className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-zinc-900">{field.label}</p>
          <RequiredCheckbox
            checked={fieldIsRequired(draft, field.id)}
            disabled={field.locked}
            onChange={
              field.locked
                ? undefined
                : (required) => setFieldRequired(draft, update, field.id, required)
            }
          />
        </div>
      ))}
    </div>
  );
}
