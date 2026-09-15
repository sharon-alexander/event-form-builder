import type { FieldId, FieldSettings } from "../../../locations/types";
import { isFieldRequired, isFieldShown } from "../../../form/fieldCatalog";
import type { EditableLocation } from "../../pages/FormEditorPage";

function FieldToggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
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
      {label}
    </label>
  );
}

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
    <FieldToggle
      label="Required"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

export function ShowCheckbox({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <FieldToggle
      label="Show"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

export function fieldIsRequired(
  draft: EditableLocation,
  fieldId: FieldId,
): boolean {
  return isFieldRequired({ fieldSettings: draft.field_settings }, fieldId);
}

export function fieldIsShown(
  draft: EditableLocation,
  fieldId: FieldId,
): boolean {
  return isFieldShown({ fieldSettings: draft.field_settings }, fieldId);
}

function patchFieldSetting(
  draft: EditableLocation,
  update: (patch: Partial<EditableLocation>) => void,
  fieldId: FieldId,
  patch: FieldSettings,
) {
  update({
    field_settings: {
      ...draft.field_settings,
      [fieldId]: {
        ...draft.field_settings[fieldId],
        ...patch,
      },
    },
  });
}

export function setFieldRequired(
  draft: EditableLocation,
  update: (patch: Partial<EditableLocation>) => void,
  fieldId: FieldId,
  required: boolean,
) {
  patchFieldSetting(draft, update, fieldId, { required });
}

export function setFieldShown(
  draft: EditableLocation,
  update: (patch: Partial<EditableLocation>) => void,
  fieldId: FieldId,
  shown: boolean,
) {
  patchFieldSetting(draft, update, fieldId, { shown });
}
