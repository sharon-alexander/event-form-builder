import type { EventBookingType } from "../../../types";
import { DAYS_OF_WEEK } from "../../../types";
import type { RuleFieldRef, StepId } from "../../../locations/types";
import {
  availabilitySummary,
  availabilityUsesWeekdays,
  dateConditionWarning,
  draftFromAvailabilityRules,
  EMPTY_FORM_RULES,
  normalizeAvailabilityDraft,
  setAvailabilityRules,
  type OptionAvailabilityDraft,
} from "../../../form/conditions";
import type { EditableLocation } from "../../pages/FormEditorPage";

const BOOKING_OPTIONS: { value: EventBookingType; label: string }[] = [
  { value: "private_event", label: "Private event" },
  { value: "large_party", label: "Large party" },
];

interface Props {
  id: string;
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
  field: RuleFieldRef;
  optionValue: string;
  steps: StepId[];
  stepId: StepId;
  label?: string;
  /** Meal choices stay visible and are disabled outside these days. */
  disableInsteadOfHide?: boolean;
}

export default function AvailabilityEditor({
  id,
  draft,
  update,
  field,
  optionValue,
  steps,
  stepId,
  label,
  disableInsteadOfHide = false,
}: Props) {
  const rules = draft.form_rules ?? EMPTY_FORM_RULES;
  const value = draftFromAvailabilityRules(rules, field, optionValue);
  const summary = availabilitySummary(value);
  const dayWarning =
    availabilityUsesWeekdays(rules, field, optionValue)
      ? dateConditionWarning(steps, stepId)
      : null;

  function commit(next: OptionAvailabilityDraft | undefined) {
    update({
      form_rules: setAvailabilityRules(
        rules,
        field,
        optionValue,
        normalizeAvailabilityDraft(next),
      ),
    });
  }

  function setGuestBound(key: "minGuests" | "maxGuests", raw: string) {
    const next: OptionAvailabilityDraft = { ...value };
    const n = Number(raw);
    if (!raw.trim() || !Number.isFinite(n) || n <= 0) {
      delete next[key];
    } else {
      next[key] = Math.floor(n);
    }
    commit(next);
  }

  function toggleBooking(type: EventBookingType) {
    const current = value?.bookingTypes ?? [];
    const bookingTypes = current.includes(type)
      ? current.filter((item) => item !== type)
      : [...current, type];
    commit({ ...value, bookingTypes });
  }

  function toggleDay(day: string) {
    const current = value?.daysOfWeek ?? [];
    const daysOfWeek = current.includes(day)
      ? current.filter((item) => item !== day)
      : [...current, day];
    commit({ ...value, daysOfWeek });
  }

  return (
    <details className="rounded-lg border border-zinc-200 bg-zinc-50">
      <summary className="cursor-pointer list-none px-3 py-2 text-xs font-medium text-zinc-700">
        <span>
          {label
            ? `${label} — ${disableInsteadOfHide ? "available when" : "show when"}`
            : disableInsteadOfHide
              ? "Available when"
              : "Show when"}
        </span>
        <span className="ml-2 font-normal text-zinc-500">
          {summary || (disableInsteadOfHide ? "Always available" : "Always shown")}
        </span>
      </summary>
      <div className="space-y-3 border-t border-zinc-200 px-3 py-3">
        <p className="text-[11px] leading-snug text-zinc-500">
          {disableInsteadOfHide
            ? "The choice stays on the form and is disabled when these rules do not match. Days apply only after an exact date."
            : "Leave blank to always show this option. Guests only see it when every rule you set matches their answers."}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="adm-label">Minimum guests</span>
            <input
              id={`${id}-min`}
              type="number"
              min={1}
              className="adm-input py-2"
              value={value?.minGuests ?? ""}
              onChange={(e) => setGuestBound("minGuests", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="adm-label">Maximum guests</span>
            <input
              id={`${id}-max`}
              type="number"
              min={1}
              className="adm-input py-2"
              value={value?.maxGuests ?? ""}
              onChange={(e) => setGuestBound("maxGuests", e.target.value)}
            />
          </label>
        </div>
        <fieldset>
          <legend className="adm-label">Booking type</legend>
          <div className="flex flex-wrap gap-3">
            {BOOKING_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-700"
              >
                <input
                  type="checkbox"
                  checked={value?.bookingTypes?.includes(option.value) ?? false}
                  onChange={() => toggleBooking(option.value)}
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                />
                {option.label}
              </label>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            None selected means any booking type.
          </p>
        </fieldset>
        <fieldset>
          <legend className="adm-label">Days of week</legend>
          <div className="flex flex-wrap gap-1.5">
            {DAYS_OF_WEEK.map((day) => {
              const selected = value?.daysOfWeek?.includes(day) ?? false;
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleDay(day)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    selected
                      ? "bg-zinc-900 text-white"
                      : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            Applies only when the guest picks an exact date. Flexible dates still see this option.
          </p>
          {dayWarning && (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800">
              {dayWarning}
            </p>
          )}
        </fieldset>
        {summary && (
          <button
            type="button"
            className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline"
            onClick={() => commit(undefined)}
          >
            Clear conditions
          </button>
        )}
      </div>
    </details>
  );
}
