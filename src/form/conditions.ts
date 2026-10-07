import { DAYS_OF_WEEK } from "../types";
import type { EventBookingType, FormData, MealService } from "../types";
import type {
  BudgetOption,
  FieldId,
  FormRule,
  FormRulesDocument,
  LocationConfig,
  RuleCondition,
  RuleConditionOp,
  RuleEffect,
  RuleFieldRef,
  StepId,
  VenueSpaceOption,
} from "../locations/types";

const FIELD_IDS = new Set<FieldId>([
  "bookingType",
  "guestCount",
  "eventCategory",
  "eventFormat",
  "eventDate",
  "backupDate",
  "preferredDays",
  "budget",
  "venueSpace",
  "timing",
  "services",
  "infoAcknowledged",
  "consideringOtherVenues",
  "otherVenuesDetails",
  "referralSource",
  "firstName",
  "lastName",
  "email",
  "phone",
  "company",
  "preferredSiteVisitDates",
  "additionalNotes",
]);

const STEP_IDS = new Set<StepId>([
  "event_type",
  "headcount",
  "event_format",
  "event_date",
  "budget",
  "venue_space",
  "timing",
  "services",
  "info_acknowledge",
  "other_venues_referral",
  "contact",
]);

const FIELD_REFS = new Set<RuleFieldRef>([
  "guestCount",
  "bookingType",
  "eventDate",
  "eventCategory",
  "eventFormat",
  "budget",
  "venueSpace",
  "mealService",
  "services",
]);

const OPS = new Set<RuleConditionOp>([
  "eq",
  "in",
  "gt",
  "gte",
  "lt",
  "lte",
  "weekdayIn",
]);

const DAY_SET = new Set<string>(DAYS_OF_WEEK);

const WEEKDAY_FROM_INDEX = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const BOOKING_LABELS: Record<EventBookingType, string> = {
  private_event: "Private event",
  large_party: "Large party",
};

export const EMPTY_FORM_RULES: FormRulesDocument = { version: 1, rules: [] };

export interface RuleMessage {
  field: RuleFieldRef;
  html: string;
  severity: "info" | "warn" | "block";
  ruleId: string;
}

export interface RuleEvaluation {
  hiddenOptions: Map<RuleFieldRef, Set<string>>;
  hiddenFields: Set<FieldId>;
  hiddenSteps: Set<StepId>;
  messages: RuleMessage[];
  blockedFields: Set<RuleFieldRef>;
}

function emptyEvaluation(): RuleEvaluation {
  return {
    hiddenOptions: new Map(),
    hiddenFields: new Set(),
    hiddenSteps: new Set(),
    messages: [],
    blockedFields: new Set(),
  };
}

/** Shape the "show this choice when" panel edits. Compiles into a hide rule. */
export interface OptionAvailabilityDraft {
  minGuests?: number;
  maxGuests?: number;
  bookingTypes?: EventBookingType[];
  daysOfWeek?: string[];
}

function positiveInt(value: unknown): number | undefined {
  const n =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.floor(n);
}

function isFieldRef(value: unknown): value is RuleFieldRef {
  return typeof value === "string" && FIELD_REFS.has(value as RuleFieldRef);
}

function isOp(value: unknown): value is RuleConditionOp {
  return typeof value === "string" && OPS.has(value as RuleConditionOp);
}

function parseCondition(raw: unknown): RuleCondition | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const rec = raw as Record<string, unknown>;

  if (Array.isArray(rec.all)) {
    const all = rec.all.map(parseCondition).filter((c): c is RuleCondition => !!c);
    return all.length > 0 ? { all } : null;
  }
  if (Array.isArray(rec.any)) {
    const any = rec.any.map(parseCondition).filter((c): c is RuleCondition => !!c);
    return any.length > 0 ? { any } : null;
  }
  if ("not" in rec) {
    const not = parseCondition(rec.not);
    return not ? { not } : null;
  }

  if (!isFieldRef(rec.field) || !isOp(rec.op)) return null;
  const next: RuleCondition = {
    field: rec.field,
    op: rec.op,
    value: rec.value,
  };
  if (rec.passIfEmpty === true) next.passIfEmpty = true;
  return next;
}

function parseEffect(raw: unknown): RuleEffect | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const rec = raw as Record<string, unknown>;
  if (rec.kind === "hideOption") {
    if (!isFieldRef(rec.field) || typeof rec.optionValue !== "string" || !rec.optionValue) {
      return null;
    }
    return { kind: "hideOption", field: rec.field, optionValue: rec.optionValue };
  }
  if (rec.kind === "hideField") {
    if (typeof rec.field !== "string" || !FIELD_IDS.has(rec.field as FieldId)) return null;
    return { kind: "hideField", field: rec.field as FieldId };
  }
  if (rec.kind === "hideStep") {
    if (typeof rec.stepId !== "string" || !STEP_IDS.has(rec.stepId as StepId)) return null;
    return { kind: "hideStep", stepId: rec.stepId as StepId };
  }
  if (rec.kind === "message") {
    if (!isFieldRef(rec.field) || typeof rec.html !== "string") return null;
    const severity =
      rec.severity === "info" || rec.severity === "warn" || rec.severity === "block"
        ? rec.severity
        : null;
    if (!severity) return null;
    return { kind: "message", field: rec.field, html: rec.html, severity };
  }
  return null;
}

function parseRule(raw: unknown): FormRule | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const rec = raw as Record<string, unknown>;
  if (typeof rec.id !== "string" || !rec.id) return null;
  const when = parseCondition(rec.when);
  if (!when || !Array.isArray(rec.then)) return null;
  const then = rec.then.map(parseEffect).filter((e): e is RuleEffect => !!e);
  if (then.length === 0) return null;

  return {
    id: rec.id,
    enabled: rec.enabled !== false,
    when,
    then,
  };
}

export function parseFormRules(raw: unknown): FormRulesDocument {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return EMPTY_FORM_RULES;
  const rec = raw as Record<string, unknown>;
  if (rec.version !== 1) return EMPTY_FORM_RULES;
  if (!Array.isArray(rec.rules)) return EMPTY_FORM_RULES;
  return {
    version: 1,
    rules: rec.rules.map(parseRule).filter((r): r is FormRule => !!r),
  };
}

/** Local calendar day for a `YYYY-MM-DD` value. */
export function weekdayFromEventDate(eventDate: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(eventDate);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return WEEKDAY_FROM_INDEX[date.getDay()] ?? null;
}

function fieldValue(field: RuleFieldRef, data: FormData): unknown {
  switch (field) {
    case "guestCount":
      return data.guestCount;
    case "bookingType":
      return data.bookingType;
    case "eventDate":
      return data.datesFlexible ? null : data.eventDate || null;
    case "eventCategory":
      return data.eventCategory;
    case "eventFormat":
      return data.eventFormat;
    case "budget":
      return data.budget;
    case "venueSpace":
      return data.venueSpace;
    case "mealService":
      return data.mealService;
    case "services":
      return data.services;
    default:
      return null;
  }
}

function isEmptyValue(field: RuleFieldRef, value: unknown, data: FormData): boolean {
  if (field === "eventDate") {
    return data.datesFlexible || !data.eventDate;
  }
  if (field === "guestCount") {
    return value == null || (typeof value === "number" && value <= 0);
  }
  if (Array.isArray(value)) return value.length === 0;
  return value == null || value === "";
}

function compareNumber(left: unknown, op: RuleConditionOp, right: unknown): boolean {
  if (left == null || left === "" || right == null || right === "") return false;
  const a = typeof left === "number" ? left : Number(left);
  const b = typeof right === "number" ? right : Number(right);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  switch (op) {
    case "eq":
      return a === b;
    case "gt":
      return a > b;
    case "gte":
      return a >= b;
    case "lt":
      return a < b;
    case "lte":
      return a <= b;
    default:
      return false;
  }
}

function matchesLeaf(
  condition: Extract<RuleCondition, { field: RuleFieldRef }>,
  data: FormData,
): boolean {
  const value = fieldValue(condition.field, data);
  if (isEmptyValue(condition.field, value, data)) {
    return condition.passIfEmpty === true;
  }

  switch (condition.op) {
    case "eq":
      return value === condition.value;
    case "in": {
      if (!Array.isArray(condition.value)) return false;
      const allowed = condition.value as unknown[];
      if (Array.isArray(value)) {
        return value.some((item) => allowed.includes(item));
      }
      return allowed.includes(value);
    }
    case "gt":
    case "gte":
    case "lt":
    case "lte":
      return compareNumber(value, condition.op, condition.value);
    case "weekdayIn": {
      if (!Array.isArray(condition.value) || typeof value !== "string") return false;
      const weekday = weekdayFromEventDate(value);
      return !!weekday && condition.value.includes(weekday);
    }
    default:
      return false;
  }
}

export function matchesCondition(condition: RuleCondition, data: FormData): boolean {
  if ("all" in condition) {
    return condition.all.every((c) => matchesCondition(c, data));
  }
  if ("any" in condition) {
    return condition.any.some((c) => matchesCondition(c, data));
  }
  if ("not" in condition) {
    return !matchesCondition(condition.not, data);
  }
  return matchesLeaf(condition, data);
}

export function evaluateRules(
  rules: FormRulesDocument | null | undefined,
  data: FormData,
): RuleEvaluation {
  const doc = rules ?? EMPTY_FORM_RULES;
  if (doc.rules.length === 0) return emptyEvaluation();

  const hiddenOptions = new Map<RuleFieldRef, Set<string>>();
  const hiddenFields = new Set<FieldId>();
  const hiddenSteps = new Set<StepId>();
  const messages: RuleMessage[] = [];
  const blockedFields = new Set<RuleFieldRef>();

  for (const rule of doc.rules) {
    if (!rule.enabled) continue;
    if (!matchesCondition(rule.when, data)) continue;

    for (const effect of rule.then) {
      if (effect.kind === "hideOption") {
        let set = hiddenOptions.get(effect.field);
        if (!set) {
          set = new Set();
          hiddenOptions.set(effect.field, set);
        }
        set.add(effect.optionValue);
      } else if (effect.kind === "hideField") {
        hiddenFields.add(effect.field);
      } else if (effect.kind === "hideStep") {
        hiddenSteps.add(effect.stepId);
      } else {
        messages.push({
          field: effect.field,
          html: effect.html,
          severity: effect.severity,
          ruleId: rule.id,
        });
        if (effect.severity === "block") {
          blockedFields.add(effect.field);
        }
      }
    }
  }

  return { hiddenOptions, hiddenFields, hiddenSteps, messages, blockedFields };
}

export function isOptionHidden(
  evaluation: RuleEvaluation,
  field: RuleFieldRef,
  optionValue: string,
): boolean {
  return evaluation.hiddenOptions.get(field)?.has(optionValue) ?? false;
}

export function messagesForField(
  evaluation: RuleEvaluation,
  field: RuleFieldRef,
): RuleMessage[] {
  return evaluation.messages.filter((message) => message.field === field);
}

export function fieldIsBlocked(
  evaluation: RuleEvaluation,
  field: RuleFieldRef,
): boolean {
  return evaluation.blockedFields.has(field);
}

export function isFieldHidden(evaluation: RuleEvaluation, field: FieldId): boolean {
  return evaluation.hiddenFields.has(field);
}

export function isStepHidden(evaluation: RuleEvaluation, stepId: StepId): boolean {
  return evaluation.hiddenSteps.has(stepId);
}

export function formatDayList(days: string[]): string {
  const sorted = [...days]
    .filter((day) => DAY_SET.has(day))
    .sort((a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b));
  if (sorted.length === 0) return "";
  if (sorted.length === 1) return sorted[0]!;
  const indexes = sorted.map((day) => DAYS_OF_WEEK.indexOf(day));
  const contiguous = indexes.every((n, i) => i === 0 || n === indexes[i - 1]! + 1);
  if (contiguous) return `${sorted[0]} – ${sorted[sorted.length - 1]}`;
  if (sorted.length === 2) return `${sorted[0]} and ${sorted[1]}`;
  return `${sorted.slice(0, -1).join(", ")}, and ${sorted[sorted.length - 1]}`;
}

export function availabilitySummary(draft: OptionAvailabilityDraft | undefined): string {
  if (!draft) return "";
  const parts: string[] = [];
  const { minGuests, maxGuests, bookingTypes, daysOfWeek } = draft;
  if (minGuests != null && maxGuests != null) {
    parts.push(`${minGuests}–${maxGuests} guests`);
  } else if (minGuests != null) {
    parts.push(`${minGuests}+ guests`);
  } else if (maxGuests != null) {
    parts.push(`Up to ${maxGuests} guests`);
  }
  if (bookingTypes && bookingTypes.length > 0) {
    parts.push(bookingTypes.map((type) => BOOKING_LABELS[type]).join(", "));
  }
  if (daysOfWeek && daysOfWeek.length > 0) {
    const days = formatDayList(daysOfWeek);
    if (days) parts.push(days);
  }
  return parts.join(" · ");
}

export function normalizeAvailabilityDraft(
  input: OptionAvailabilityDraft | undefined,
): OptionAvailabilityDraft | undefined {
  if (!input) return undefined;
  const next: OptionAvailabilityDraft = {};
  const minGuests = positiveInt(input.minGuests);
  const maxGuests = positiveInt(input.maxGuests);
  if (minGuests != null) next.minGuests = minGuests;
  if (maxGuests != null) next.maxGuests = maxGuests;
  if (input.bookingTypes && input.bookingTypes.length > 0) {
    next.bookingTypes = input.bookingTypes.filter(
      (value): value is EventBookingType =>
        value === "private_event" || value === "large_party",
    );
    if (next.bookingTypes.length === 0) delete next.bookingTypes;
  }
  if (input.daysOfWeek && input.daysOfWeek.length > 0) {
    next.daysOfWeek = input.daysOfWeek.filter((day) => DAY_SET.has(day));
    if (next.daysOfWeek.length === 0) delete next.daysOfWeek;
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

export function dateConditionWarning(steps: StepId[], stepId: StepId): string | null {
  const dateIdx = steps.indexOf("event_date");
  const stepIdx = steps.indexOf(stepId);
  if (dateIdx === -1) {
    return "Day-of-week rules need the event date step. Until that step is on the form, these options stay visible.";
  }
  if (stepIdx !== -1 && dateIdx > stepIdx) {
    return "Move the event date step before this one. Until the guest picks an exact date, these options stay visible.";
  }
  return null;
}

function newRuleId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Drop the show-when hide rule for an option that was removed. */
export function removeAvailabilityRules(
  rules: FormRulesDocument | null | undefined,
  field: RuleFieldRef,
  optionValue: string,
): FormRulesDocument {
  const doc = rules ?? EMPTY_FORM_RULES;
  return {
    version: 1,
    rules: doc.rules.filter(
      (rule) => !isOwnedAvailabilityRule(rule, field, optionValue),
    ),
  };
}

function isOwnedAvailabilityRule(
  rule: FormRule,
  field: RuleFieldRef,
  optionValue: string,
): boolean {
  return rule.then.some(
    (effect) =>
      effect.kind === "hideOption" &&
      effect.field === field &&
      effect.optionValue === optionValue,
  );
}

/** Read the show-when draft for one option from its hide rule. */
export function draftFromAvailabilityRules(
  rules: FormRulesDocument,
  field: RuleFieldRef,
  optionValue: string,
): OptionAvailabilityDraft | undefined {
  const owned = rules.rules.filter((rule) =>
    isOwnedAvailabilityRule(rule, field, optionValue),
  );
  if (owned.length === 0) return undefined;

  const draft: OptionAvailabilityDraft = {};
  for (const rule of owned) {
    const when = rule.when;
    if (!("all" in when) && !("field" in when) && !("any" in when) && !("not" in when)) {
      continue;
    }
    const leaves: Extract<RuleCondition, { field: RuleFieldRef }>[] = [];
    collectLeaves(when, leaves);
    for (const leaf of leaves) {
      if (leaf.field === "guestCount") {
        if (leaf.op === "gte" && typeof leaf.value === "number") {
          draft.minGuests = leaf.value;
        }
        if (leaf.op === "lte" && typeof leaf.value === "number") {
          draft.maxGuests = leaf.value;
        }
      }
      if (leaf.field === "bookingType" && leaf.op === "in" && Array.isArray(leaf.value)) {
        draft.bookingTypes = leaf.value.filter(
          (value): value is EventBookingType =>
            value === "private_event" || value === "large_party",
        );
      }
      if (leaf.field === "eventDate" && leaf.op === "weekdayIn" && Array.isArray(leaf.value)) {
        draft.daysOfWeek = leaf.value.filter(
          (value): value is string => typeof value === "string" && DAY_SET.has(value),
        );
      }
    }
  }
  return normalizeAvailabilityDraft(draft);
}

function collectLeaves(
  condition: RuleCondition,
  out: Extract<RuleCondition, { field: RuleFieldRef }>[],
) {
  if ("all" in condition) {
    condition.all.forEach((c) => collectLeaves(c, out));
    return;
  }
  if ("any" in condition) {
    condition.any.forEach((c) => collectLeaves(c, out));
    return;
  }
  if ("not" in condition) {
    // Panel-owned hide rules use `not: { all: showWhen }`. Recurse into the inner show conditions.
    collectLeaves(condition.not, out);
    return;
  }
  out.push(condition);
}

/** Compile show-when settings into a single hide rule for that option. */
export function setAvailabilityRules(
  rules: FormRulesDocument,
  field: RuleFieldRef,
  optionValue: string,
  draft: OptionAvailabilityDraft | undefined,
): FormRulesDocument {
  const kept = rules.rules.filter(
    (rule) => !isOwnedAvailabilityRule(rule, field, optionValue),
  );
  const normalized = normalizeAvailabilityDraft(draft);
  if (!normalized) {
    return { version: 1, rules: kept };
  }

  const showWhen: RuleCondition[] = [];
  if (normalized.minGuests != null) {
    showWhen.push({
      field: "guestCount",
      op: "gte",
      value: normalized.minGuests,
      passIfEmpty: true,
    });
  }
  if (normalized.maxGuests != null) {
    showWhen.push({
      field: "guestCount",
      op: "lte",
      value: normalized.maxGuests,
      passIfEmpty: true,
    });
  }
  if (normalized.bookingTypes && normalized.bookingTypes.length > 0) {
    showWhen.push({
      field: "bookingType",
      op: "in",
      value: normalized.bookingTypes,
      passIfEmpty: true,
    });
  }
  if (normalized.daysOfWeek && normalized.daysOfWeek.length > 0) {
    showWhen.push({
      field: "eventDate",
      op: "weekdayIn",
      value: normalized.daysOfWeek,
      passIfEmpty: true,
    });
  }
  if (showWhen.length === 0) {
    return { version: 1, rules: kept };
  }

  const when: RuleCondition =
    showWhen.length === 1
      ? { not: showWhen[0]! }
      : { not: { all: showWhen } };

  const rule: FormRule = {
    id: newRuleId("avail"),
    enabled: true,
    when,
    then: [{ kind: "hideOption", field, optionValue }],
  };
  return { version: 1, rules: [...kept, rule] };
}

type PruneLocation = Pick<
  LocationConfig,
  "budgetOptions" | "venueSpaces" | "formRules"
>;

export function pruneUnavailableSelections(
  location: PruneLocation,
  data: FormData,
): FormData {
  const evaluation = evaluateRules(location.formRules, data);
  let next = data;

  if (data.budget && isOptionHidden(evaluation, "budget", data.budget)) {
    next = { ...next, budget: null };
  }

  if (data.venueSpace.length > 0) {
    const kept = data.venueSpace.filter(
      (value) => !isOptionHidden(evaluation, "venueSpace", value),
    );
    if (kept.length !== data.venueSpace.length) {
      next = { ...next, venueSpace: kept };
    }
  }

  if (
    data.mealService &&
    isOptionHidden(evaluation, "mealService", data.mealService)
  ) {
    next = { ...next, mealService: null, startTime: "" };
  }

  return next;
}

export function visibleBudgetOptions(
  options: BudgetOption[],
  evaluation: RuleEvaluation,
): BudgetOption[] {
  return options.filter(
    (option) => !isOptionHidden(evaluation, "budget", option.value),
  );
}

export function visibleVenueSpaces(
  options: VenueSpaceOption[],
  evaluation: RuleEvaluation,
): VenueSpaceOption[] {
  return options.filter(
    (option) => !isOptionHidden(evaluation, "venueSpace", option.value),
  );
}

export function visibleMealServices(
  options: { value: MealService; label: string }[],
  evaluation: RuleEvaluation,
): { value: MealService; label: string }[] {
  return options.filter(
    (option) => !isOptionHidden(evaluation, "mealService", option.value),
  );
}

/** Day chips shown under Lunch/Dinner when an owned availability rule lists them. */
export function mealServiceDayNote(
  rules: FormRulesDocument | null | undefined,
  meal: MealService,
): string {
  const draft = draftFromAvailabilityRules(
    rules ?? EMPTY_FORM_RULES,
    "mealService",
    meal,
  );
  if (!draft?.daysOfWeek || draft.daysOfWeek.length === 0) return "";
  return `${formatDayList(draft.daysOfWeek)} only`;
}

/** True when any owned availability rule for this step uses weekdays. */
export function availabilityUsesWeekdays(
  rules: FormRulesDocument,
  field: RuleFieldRef,
  optionValue?: string,
): boolean {
  return rules.rules.some((rule) => {
    if (optionValue != null) {
      if (!isOwnedAvailabilityRule(rule, field, optionValue)) return false;
    } else if (
      !rule.then.some(
        (effect) => effect.kind === "hideOption" && effect.field === field,
      )
    ) {
      return false;
    }
    const leaves: Extract<RuleCondition, { field: RuleFieldRef }>[] = [];
    collectLeaves(rule.when, leaves);
    return leaves.some((leaf) => leaf.op === "weekdayIn");
  });
}
