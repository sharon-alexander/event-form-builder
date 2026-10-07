import { useState } from "react";
import type { FieldSettings, NumberLimit } from "../../../locations/types";
import type { EditableLocation } from "../../pages/FormEditorPage";
import RichTextEditor from "./RichTextEditor";
import { fieldIsRequired, setFieldRequired } from "./RequiredCheckbox";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
}

export default function HeadcountLimitsEditor({ draft, update }: Props) {
  const settings = draft.field_settings.guestCount;
  const [minOpen, setMinOpen] = useState(!!settings?.min);
  const [maxOpen, setMaxOpen] = useState(!!settings?.max);

  function writeLimit(key: "min" | "max", limit: NumberLimit | undefined) {
    const current: FieldSettings = { ...draft.field_settings.guestCount };
    if (limit) current[key] = limit;
    else delete current[key];
    update({
      field_settings: {
        ...draft.field_settings,
        guestCount: current,
      },
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white px-4 py-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <LimitToggle
          label="Required"
          checked={fieldIsRequired(draft, "guestCount")}
          onChange={(required) =>
            setFieldRequired(draft, update, "guestCount", required)
          }
        />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-l border-zinc-200 pl-5">
          <LimitToggle
            label="Minimum"
            checked={minOpen}
            onChange={(on) => {
              setMinOpen(on);
              if (!on) writeLimit("min", undefined);
            }}
          />
          <LimitToggle
            label="Maximum"
            checked={maxOpen}
            onChange={(on) => {
              setMaxOpen(on);
              if (!on) writeLimit("max", undefined);
            }}
          />
        </div>
      </div>
      {minOpen && (
        <LimitFields
          id="headcount-min"
          title="Minimum guests"
          emptyHint="Enter a number to add an optional message for counts below it."
          messagePlaceholder="E.g. For fewer than 5 guests, consider making a reservation instead."
          limit={settings?.min}
          behavior="warn"
          onChange={(min) => writeLimit("min", min)}
        />
      )}
      {maxOpen && (
        <LimitFields
          id="headcount-max"
          title="Maximum guests"
          emptyHint="Enter a number to add an optional message for counts above it."
          messagePlaceholder="This space holds up to 40 guests."
          limit={settings?.max}
          behavior="block"
          onChange={(max) => writeLimit("max", max)}
        />
      )}
    </div>
  );
}

function LimitToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-zinc-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
      />
      {label}
    </label>
  );
}

function LimitFields({
  id,
  title,
  emptyHint,
  messagePlaceholder,
  limit,
  behavior,
  onChange,
}: {
  id: string;
  title: string;
  emptyHint: string;
  messagePlaceholder: string;
  limit: NumberLimit | undefined;
  behavior: NumberLimit["behavior"];
  onChange: (next: NumberLimit | undefined) => void;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-zinc-900">{title}</h4>
      <label className="block max-w-[10rem]">
        <span className="sr-only">{title}</span>
        <input
          id={id}
          type="number"
          min={1}
          className="adm-input py-2"
          placeholder="Number"
          value={limit?.value ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            const n = Number(raw);
            if (!raw.trim() || !Number.isFinite(n) || n <= 0) {
              onChange(undefined);
              return;
            }
            onChange({
              value: Math.floor(n),
              messageHtml: limit?.messageHtml ?? "",
              behavior,
            });
          }}
        />
      </label>
      {limit ? (
        <RichTextEditor
          id={`${id}-message`}
          value={limit.messageHtml}
          onChange={(messageHtml) =>
            onChange({ ...limit, messageHtml, behavior })
          }
          placeholder={messagePlaceholder}
          compact
        />
      ) : (
        <p className="text-[11px] text-zinc-400">{emptyHint}</p>
      )}
    </div>
  );
}
