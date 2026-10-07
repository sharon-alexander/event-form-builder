import { useEffect, useState, type ReactNode } from "react";
import { DAYS_OF_WEEK, EVENT_FORMATS } from "../../../types";
import type { EventBookingType } from "../../../types";
import type {
  FieldId,
  FormRule,
  RuleCondition,
  RuleConditionOp,
  RuleFieldRef,
  StepId,
} from "../../../locations/types";
import { fieldsForStep } from "../../../form/fieldCatalog";
import { EMPTY_FORM_RULES } from "../../../form/conditions";
import { STEP_LABELS } from "../../constants/defaultFormSteps";
import type { EditableLocation } from "../../pages/FormEditorPage";

const OPTION_STEP: Partial<Record<RuleFieldRef, StepId>> = {
  budget: "budget",
  venueSpace: "venue_space",
  mealService: "timing",
};

const STEP_SOURCES: Partial<Record<StepId, { field: RuleFieldRef; label: string }[]>> = {
  event_type: [{ field: "bookingType", label: "Booking type" }],
  headcount: [{ field: "guestCount", label: "Guest count" }],
  event_format: [
    { field: "eventCategory", label: "Event type" },
    { field: "eventFormat", label: "Format" },
  ],
  event_date: [{ field: "eventDate", label: "Event date" }],
  budget: [{ field: "budget", label: "Budget" }],
  venue_space: [{ field: "venueSpace", label: "Venue space" }],
  timing: [{ field: "mealService", label: "Meal" }],
  services: [{ field: "services", label: "Services" }],
};

const NUMBER_OPS: { op: RuleConditionOp; label: string }[] = [
  { op: "gt", label: "is greater than" },
  { op: "gte", label: "is at least" },
  { op: "lt", label: "is less than" },
  { op: "lte", label: "is at most" },
  { op: "eq", label: "is" },
];

interface Props {
  stepId: StepId;
  steps: StepId[];
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
  children: ReactNode;
}

/** Question display, choice show-when, and headcount min/max for one step. */
export function stepLogicCount(draft: EditableLocation, stepId: StepId): number {
  const rules = draft.form_rules ?? EMPTY_FORM_RULES;
  const fieldIds = new Set(fieldsForStep(stepId).map((field) => field.id));
  let count = rules.rules.filter(
    (rule) =>
      rule.enabled !== false &&
      (ruleTargetsStep(rule, stepId, fieldIds) || choiceRuleForStep(rule, stepId)),
  ).length;
  if (stepId === "headcount") {
    const limits = draft.field_settings.guestCount;
    if (limits?.min) count += 1;
    if (limits?.max) count += 1;
  }
  return count;
}

export function ruleCountLabel(count: number): string {
  return `${count} rule${count === 1 ? "" : "s"}`;
}

export default function QuestionDisplayEditor({
  stepId,
  steps,
  draft,
  update,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(stepId);
  const count = stepLogicCount(draft, stepId);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function openMap() {
    setActiveStep(stepId);
    setOpen(true);
  }

  return (
    <section>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">{children}</div>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={count > 0 ? `Logic, ${ruleCountLabel(count)}` : "Logic"}
          title="Logic"
          onClick={openMap}
          className={`relative mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
            open
              ? "border-zinc-900 bg-zinc-900 text-white"
              : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-900"
          }`}
        >
          <EyeIcon />
          {count > 0 && !open && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
              {count}
            </span>
          )}
        </button>
      </div>
      {open && (
        <LogicMap
          steps={steps}
          activeStep={activeStep}
          draft={draft}
          update={update}
          onSelect={setActiveStep}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}

function LogicMap({
  steps,
  activeStep,
  draft,
  update,
  onSelect,
  onClose,
}: {
  steps: StepId[];
  activeStep: StepId;
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
  onSelect: (stepId: StepId) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <button
        type="button"
        aria-label="Close logic"
        className="absolute inset-0 bg-zinc-900/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logic-map-title"
        className="relative flex max-h-[min(40rem,calc(100vh-2rem))] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50">
          <div className="border-b border-zinc-200 px-4 py-4">
            <h2 id="logic-map-title" className="text-sm font-semibold text-zinc-900">
              Logic
            </h2>
            <p className="mt-1 text-[11px] leading-snug text-zinc-500">
              Which pages are hidden based on earlier answers.
            </p>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto p-2">
            {steps.map((id, index) => {
              const count = stepLogicCount(draft, id);
              const selected = id === activeStep;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onSelect(id)}
                    className={`flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left ${
                      selected ? "bg-white shadow-sm ring-1 ring-zinc-200" : "hover:bg-white/70"
                    }`}
                  >
                    <span className="mt-0.5 w-4 shrink-0 text-center text-[11px] font-medium text-zinc-400">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-zinc-900">
                        {STEP_LABELS[id]}
                      </span>
                      {count > 0 && (
                        <span className="mt-1 inline-block rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                          {ruleCountLabel(count)}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-zinc-900">
              {STEP_LABELS[activeStep]}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <QuestionDisplayPanel
              key={activeStep}
              stepId={activeStep}
              steps={steps}
              draft={draft}
              update={update}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionDisplayPanel({
  stepId,
  steps,
  draft,
  update,
}: {
  stepId: StepId;
  steps: StepId[];
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
}) {
  const rules = draft.form_rules ?? EMPTY_FORM_RULES;
  const pageFields = fieldsForStep(stepId);
  const fieldIds = new Set(pageFields.map((field) => field.id));
  const sources = previousSources(steps, stepId);
  const displayRules = rules.rules.filter((rule) => ruleTargetsStep(rule, stepId, fieldIds));
  const hasChoiceRules = rules.rules.some(
    (rule) => rule.enabled !== false && choiceRuleForStep(rule, stepId),
  );
  const limits = stepId === "headcount" ? draft.field_settings.guestCount : undefined;
  const [pending, setPending] = useState<FormRule | null>(null);
  const visibleRules = pending ? [...displayRules, pending] : displayRules;

  function write(next: FormRule[]) {
    const kept = rules.rules.filter((rule) => !ruleTargetsStep(rule, stepId, fieldIds));
    update({ form_rules: { version: 1, rules: [...kept, ...next] } });
  }

  function commit(next: FormRule) {
    if (!isCompleteRule(next)) {
      write(displayRules.filter((rule) => rule.id !== next.id));
      setPending(next);
      return;
    }
    if (pending?.id === next.id) {
      write([...displayRules, next]);
      setPending(null);
      return;
    }
    write(displayRules.map((rule) => (rule.id === next.id ? next : rule)));
  }

  function remove(id: string) {
    if (pending?.id === id) {
      setPending(null);
      return;
    }
    write(displayRules.filter((rule) => rule.id !== id));
  }

  function addRule() {
    const source = sources[0];
    if (!source || pending) return;
    setPending({
      id: newId(),
      enabled: true,
      when: defaultWhen(source.field),
      then: [{ kind: "hideStep", stepId }],
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-900">Question display</p>
      <p className="text-xs text-zinc-500">
        All other cases: <span className="font-medium text-zinc-700">Show question</span>
      </p>
      {displayRules.length === 0 && hasChoiceRules && (
        <p className="text-xs text-zinc-500">Choice rules are edited on each choice.</p>
      )}
      {displayRules.length === 0 && (limits?.min || limits?.max) && (
        <p className="text-xs text-zinc-500">Minimum and maximum are set on this question.</p>
      )}
      {visibleRules.map((rule) => (
        <DisplayRuleRow
          key={rule.id}
          rule={rule}
          stepId={stepId}
          pageFields={pageFields.length > 1 ? pageFields : []}
          sources={sourcesForRule(sources, rule)}
          draft={draft}
          onChange={commit}
          onRemove={() => remove(rule.id)}
        />
      ))}
      <button
        type="button"
        className="adm-btn-secondary px-3 py-1.5 text-xs"
        disabled={sources.length === 0 || pending !== null}
        onClick={addRule}
      >
        Add hide question rule
      </button>
      {sources.length === 0 && (
        <p className="text-[11px] text-zinc-400">
          This page is first, so there is no earlier answer to hide it with.
        </p>
      )}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 9.2c.5-1.4 1.5-2.2 2.4-2.4M12 8.2V6.2M16 9.2c-.5-1.4-1.5-2.2-2.4-2.4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M3 13.2S6.8 8.6 12 8.6s9 4.6 9 4.6-3.8 4.6-9 4.6-9-4.6-9-4.6z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13.2" r="2.1" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function DisplayRuleRow({
  rule,
  stepId,
  pageFields,
  sources,
  draft,
  onChange,
  onRemove,
}: {
  rule: FormRule;
  stepId: StepId;
  pageFields: { id: FieldId; label: string }[];
  sources: { field: RuleFieldRef; label: string }[];
  draft: EditableLocation;
  onChange: (rule: FormRule) => void;
  onRemove: () => void;
}) {
  const leaf = "field" in rule.when ? rule.when : null;
  const effect = rule.then.find(
    (item) => item.kind === "hideStep" || item.kind === "hideField",
  );
  if (!leaf || !effect || (effect.kind !== "hideStep" && effect.kind !== "hideField")) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2">
        <p className="text-xs text-zinc-600">Custom hide rule</p>
        <RemoveRuleButton onClick={onRemove} />
      </div>
    );
  }

  const targetValue =
    effect.kind === "hideStep" ? "step" : `field:${effect.field}`;
  const ops = operatorsFor(leaf.field);

  function setTarget(value: string) {
    const then =
      value === "step"
        ? [{ kind: "hideStep" as const, stepId }]
        : [{ kind: "hideField" as const, field: value.slice("field:".length) as FieldId }];
    onChange({ ...rule, then });
  }

  function setSource(field: RuleFieldRef) {
    onChange({ ...rule, when: defaultWhen(field) });
  }

  function setOp(op: RuleConditionOp) {
    onChange({
      ...rule,
      when: { ...leaf!, op, value: op === "weekdayIn" ? [] : leaf!.value },
    });
  }

  return (
    <div className="space-y-2 rounded-lg bg-zinc-50 px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-9 items-center text-xs text-zinc-500">Hide</span>
        {pageFields.length === 0 ? (
          <span className="inline-flex h-9 items-center text-xs font-medium text-zinc-800">
            this page
          </span>
        ) : (
          <select
            className="adm-input h-9 w-auto py-0 text-xs"
            value={targetValue}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="step">This page</option>
            {pageFields.map((field) => (
              <option key={field.id} value={`field:${field.id}`}>
                {field.label}
              </option>
            ))}
          </select>
        )}
        <span className="inline-flex h-9 items-center text-xs text-zinc-500">when</span>
        <select
          className="adm-input h-9 w-auto py-0 text-xs"
          value={leaf.field}
          onChange={(e) => setSource(e.target.value as RuleFieldRef)}
        >
          {sources.map((source) => (
            <option key={source.field} value={source.field}>
              {source.label}
            </option>
          ))}
        </select>
        <select
          className="adm-input h-9 w-auto py-0 text-xs"
          value={leaf.op}
          onChange={(e) => setOp(e.target.value as RuleConditionOp)}
        >
          {ops.map((op) => (
            <option key={op.op} value={op.op}>
              {op.label}
            </option>
          ))}
        </select>
        <ValueInput
          field={leaf.field}
          op={leaf.op}
          value={leaf.value}
          draft={draft}
          onChange={(value) => onChange({ ...rule, when: { ...leaf, value } })}
        />
        <RemoveRuleButton onClick={onRemove} />
      </div>
    </div>
  );
}

function RemoveRuleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Remove rule"
      onClick={onClick}
      className="ml-auto inline-flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-md border border-zinc-200 bg-white text-zinc-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0v12a1 1 0 001 1h6a1 1 0 001-1V7"
        />
      </svg>
    </button>
  );
}

function ValueInput({
  field,
  op,
  value,
  draft,
  onChange,
}: {
  field: RuleFieldRef;
  op: RuleConditionOp;
  value: unknown;
  draft: EditableLocation;
  onChange: (value: unknown) => void;
}) {
  if (field === "guestCount" || op === "gt" || op === "gte" || op === "lt" || op === "lte") {
    const n = typeof value === "number" ? value : "";
    return (
      <input
        type="number"
        min={1}
        className="adm-input h-9 w-24 py-0 text-xs"
        value={n}
        onChange={(e) => {
          const raw = e.target.value;
          const parsed = Number(raw);
          onChange(raw.trim() && Number.isFinite(parsed) ? Math.floor(parsed) : null);
        }}
      />
    );
  }

  if (op === "weekdayIn") {
    const selected = Array.isArray(value) ? value.filter((day) => typeof day === "string") : [];
    return (
      <div className="flex flex-wrap items-center gap-1 self-center">
        {DAYS_OF_WEEK.map((day) => {
          const on = selected.includes(day);
          return (
            <button
              key={day}
              type="button"
              aria-pressed={on}
              onClick={() =>
                onChange(on ? selected.filter((item) => item !== day) : [...selected, day])
              }
              className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                on ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-200"
              }`}
            >
              {day.slice(0, 3)}
            </button>
          );
        })}
      </div>
    );
  }

  const options = choiceOptions(field, draft);
  if (options) {
    return (
      <select
        className="adm-input h-9 w-auto py-0 text-xs"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Choose</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      className="adm-input h-9 w-40 py-0 text-xs"
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function choiceOptions(
  field: RuleFieldRef,
  draft: EditableLocation,
): { value: string; label: string }[] | null {
  if (field === "bookingType") {
    const options: { value: EventBookingType; label: string }[] = [
      { value: "private_event", label: "Private event" },
      { value: "large_party", label: "Large party" },
    ];
    return options;
  }
  if (field === "eventCategory") {
    return draft.event_categories.length > 0 ? draft.event_categories : null;
  }
  if (field === "eventFormat") return EVENT_FORMATS;
  if (field === "budget") return draft.budget_options.filter((option) => option.value);
  if (field === "venueSpace") {
    return draft.venue_spaces
      .filter((option) => option.value)
      .map((option) => ({ value: option.value, label: option.label || option.value }));
  }
  if (field === "mealService") {
    return [
      { value: "lunch", label: "Lunch" },
      { value: "dinner", label: "Dinner" },
    ];
  }
  return null;
}

function operatorsFor(field: RuleFieldRef): { op: RuleConditionOp; label: string }[] {
  if (field === "guestCount") return NUMBER_OPS;
  if (field === "eventDate") return [{ op: "weekdayIn", label: "is on" }];
  return [{ op: "eq", label: "is" }];
}

function defaultWhen(field: RuleFieldRef): RuleCondition {
  const op = operatorsFor(field)[0]?.op ?? "eq";
  if (op === "weekdayIn") return { field, op, value: [] };
  if (field === "guestCount") return { field, op, value: null };
  return { field, op, value: "" };
}

function previousSources(steps: StepId[], stepId: StepId) {
  const index = steps.indexOf(stepId);
  const seen = new Set<RuleFieldRef>();
  const sources: { field: RuleFieldRef; label: string }[] = [];
  for (const step of steps.slice(0, index)) {
    for (const source of STEP_SOURCES[step] ?? []) {
      if (seen.has(source.field)) continue;
      seen.add(source.field);
      sources.push(source);
    }
  }
  return sources;
}

function sourcesForRule(
  sources: { field: RuleFieldRef; label: string }[],
  rule: FormRule,
) {
  const when = rule.when;
  if (!("field" in when)) return sources;
  if (sources.some((source) => source.field === when.field)) return sources;
  return [...sources, { field: when.field, label: when.field }];
}

function ruleTargetsStep(rule: FormRule, stepId: StepId, fieldIds: Set<FieldId>): boolean {
  return rule.then.some(
    (effect) =>
      (effect.kind === "hideStep" && effect.stepId === stepId) ||
      (effect.kind === "hideField" && fieldIds.has(effect.field)),
  );
}

function choiceRuleForStep(rule: FormRule, stepId: StepId): boolean {
  return rule.then.some(
    (effect) => effect.kind === "hideOption" && OPTION_STEP[effect.field] === stepId,
  );
}

function isCompleteRule(rule: FormRule): boolean {
  const when = rule.when;
  if (!("field" in when)) return true;
  if (when.op === "weekdayIn") {
    return Array.isArray(when.value) && when.value.length > 0;
  }
  if (
    when.field === "guestCount" ||
    when.op === "gt" ||
    when.op === "gte" ||
    when.op === "lt" ||
    when.op === "lte"
  ) {
    return typeof when.value === "number" && when.value > 0;
  }
  return typeof when.value === "string" && when.value.trim() !== "";
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `hide_${crypto.randomUUID()}`;
  }
  return `hide_${Date.now()}`;
}
