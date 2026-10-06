import {
  draftFromHeadcountMessageRules,
  EMPTY_FORM_RULES,
  setHeadcountMessageRules,
  type HeadcountLimitDraft,
  type HeadcountLimitsDraft,
} from "../../../form/conditions";
import type { EditableLocation } from "../../pages/FormEditorPage";
import RichTextEditor from "./RichTextEditor";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
}

export default function HeadcountLimitsEditor({ draft, update }: Props) {
  const rules = draft.form_rules ?? EMPTY_FORM_RULES;
  const limits = draftFromHeadcountMessageRules(rules);

  function setLimits(next: HeadcountLimitsDraft) {
    const cleaned: HeadcountLimitsDraft = {};
    if (next.min && next.min.value > 0) cleaned.min = next.min;
    if (next.max && next.max.value > 0) cleaned.max = next.max;
    update({ form_rules: setHeadcountMessageRules(rules, cleaned) });
  }

  return (
    <details className="rounded-xl border border-zinc-200 bg-white">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-zinc-900">
        Set guest-count limits
        <LimitSummary limits={limits} />
      </summary>
      <div className="space-y-5 border-t border-zinc-200 px-4 py-4">
        <p className="text-xs text-zinc-500">
          Minimum shows a message and still lets the guest continue. Maximum
          shows a message and stops them until the count is within the limit.
          Add a reservation link with the link button in the message editor.
        </p>
        <LimitFields
          id="headcount-min"
          title="Minimum guests"
          hint="Shown when the count is below this number. The guest can still continue."
          limit={limits.min}
          onChange={(min) => setLimits({ ...limits, min })}
        />
        <LimitFields
          id="headcount-max"
          title="Maximum guests"
          hint="Shown when the count is above this number. Next stays disabled until they enter this many or fewer."
          limit={limits.max}
          onChange={(max) => setLimits({ ...limits, max })}
        />
      </div>
    </details>
  );
}

function LimitSummary({ limits }: { limits: HeadcountLimitsDraft }) {
  const parts: string[] = [];
  if (limits.min) parts.push(`Min ${limits.min.value}`);
  if (limits.max) parts.push(`Max ${limits.max.value}`);
  if (parts.length === 0) return null;
  return (
    <span className="ml-2 text-xs font-normal text-zinc-500">{parts.join(" · ")}</span>
  );
}

function LimitFields({
  id,
  title,
  hint,
  limit,
  onChange,
}: {
  id: string;
  title: string;
  hint: string;
  limit: HeadcountLimitDraft | undefined;
  onChange: (next: HeadcountLimitDraft | undefined) => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <h4 className="text-xs font-semibold text-zinc-900">{title}</h4>
        <p className="mt-0.5 text-[11px] text-zinc-400">{hint}</p>
      </div>
      <label className="block max-w-[10rem]">
        <span className="sr-only">{title}</span>
        <input
          id={id}
          type="number"
          min={1}
          className="adm-input py-2"
          placeholder="No limit"
          value={limit?.value ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            const n = Number(raw);
            if (!raw.trim() || !Number.isFinite(n) || n <= 0) {
              onChange(undefined);
              return;
            }
            onChange({ value: Math.floor(n), messageHtml: limit?.messageHtml ?? "" });
          }}
        />
      </label>
      {limit ? (
        <RichTextEditor
          id={`${id}-message`}
          value={limit.messageHtml}
          onChange={(messageHtml) => onChange({ ...limit, messageHtml })}
          placeholder="Message shown to the guest"
        />
      ) : (
        <p className="text-[11px] text-zinc-400">
          Enter a guest count to write the message.
        </p>
      )}
    </div>
  );
}
