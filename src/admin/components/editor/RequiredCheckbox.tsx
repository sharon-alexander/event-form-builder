import type { FieldId } from "../../../locations/types";
import { isFieldRequired } from "../../../form/fieldCatalog";
import type { EditableLocation } from "../../pages/FormEditorPage";

export function RequiredCheckbox({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium ${
        disabled ? "cursor-default text-zinc-400" : "cursor-pointer text-zinc-600"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 disabled:opacity-60"
      />
      Required
    </label>
  );
}

export function fieldIsRequired(
  draft: EditableLocation,
  fieldId: FieldId,
): boolean {
  return isFieldRequired({ requiredFields: draft.required_fields }, fieldId);
}

export function setFieldRequired(
  draft: EditableLocation,
  update: (patch: Partial<EditableLocation>) => void,
  fieldId: FieldId,
  required: boolean,
) {
  update({
    required_fields: {
      ...draft.required_fields,
      [fieldId]: required,
    },
  });
}
