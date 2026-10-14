import { useEffect, useState } from "react";
import type {
  TimingBandHours,
  TimingHours,
  TimingStyle,
  TimingWindow,
} from "../../../locations/types";
import { draftFromAvailabilityRules, formatDayList } from "../../../form/conditions";
import {
  ADMIN_TIME_OPTIONS,
  bandWindow,
  defaultMealHours,
  defaultTimingHours,
  hoursAreSplit,
  offeredHourBands,
  type HourBand,
} from "../../../form/timingHours";
import type { EditableLocation } from "../../pages/FormEditorPage";
import { fieldIsRequired, RequiredCheckbox, setFieldRequired } from "./RequiredCheckbox";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
}

const OPTIONS: { value: TimingStyle; label: string; hint: string }[] = [
  {
    value: "standard",
    label: "Start & end times",
    hint: "Start time and end time.",
  },
  {
    value: "meal_service",
    label: "Meal service",
    hint: "Lunch or dinner, plus a start time. No end time.",
  },
];

const FRIDAY_MODES: { value: TimingBandHours["friday"]["mode"]; label: string }[] = [
  { value: "weekday", label: "Same as Mon–Thu" },
  { value: "weekend", label: "Same as weekend" },
  { value: "custom", label: "Custom" },
];

const WEEKEND_MODES: { value: TimingBandHours["weekend"]["mode"]; label: string }[] = [
  { value: "weekday", label: "Same as Mon–Thu" },
  { value: "custom", label: "Custom" },
  { value: "closed", label: "Closed" },
];

function TimeSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="adm-input min-w-0 py-1.5 text-xs"
    >
      {ADMIN_TIME_OPTIONS.map((time) => (
        <option key={time} value={time}>
          {time}
        </option>
      ))}
    </select>
  );
}

function WindowFields({
  id,
  window,
  onChange,
}: {
  id: string;
  window: TimingWindow;
  onChange: (next: TimingWindow) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <TimeSelect
        id={`${id}-start`}
        value={window.start}
        onChange={(start) => onChange({ ...window, start })}
      />
      <span className="text-[11px] text-zinc-400">to</span>
      <TimeSelect
        id={`${id}-end`}
        value={window.end}
        onChange={(end) => onChange({ ...window, end })}
      />
    </div>
  );
}

function ModeButtons<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={label}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={`rounded-md border px-2 py-1 text-[11px] font-medium ${
              selected
                ? "border-zinc-900 bg-white text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const BAND_DAYS: Record<HourBand, string[]> = {
  weekday: ["Monday", "Tuesday", "Wednesday", "Thursday"],
  friday: ["Friday"],
  weekend: ["Saturday", "Sunday"],
};

function bandDayLabel(days: string[], band: HourBand): string {
  const offered = BAND_DAYS[band].filter((day) => days.includes(day));
  return formatDayList(offered.length > 0 ? offered : BAND_DAYS[band]);
}

function shownWindow(hours: TimingBandHours, band: HourBand): TimingWindow {
  return bandWindow(hours, band) ?? hours.weekday;
}

function fridayMatchesBase(
  hours: TimingBandHours,
  base: "weekday" | "weekend",
): boolean {
  if (base === "weekday") return hours.friday.mode === "weekday";
  return (
    hours.friday.mode === "weekend" ||
    (hours.friday.mode === "weekday" && hours.weekend.mode === "weekday")
  );
}

function LimitedDayHours({
  id,
  title,
  days,
  bands,
  band,
  onChange,
}: {
  id: string;
  title: string;
  days: string[];
  bands: HourBand[];
  band: TimingBandHours;
  onChange: (next: TimingBandHours) => void;
}) {
  const hasWeekday = bands.includes("weekday");
  const hasFriday = bands.includes("friday");
  const hasWeekend = bands.includes("weekend");
  const fridayBase: "weekday" | "weekend" | null =
    hasFriday && hasWeekday && !hasWeekend
      ? "weekday"
      : hasFriday && hasWeekend && !hasWeekday
        ? "weekend"
        : null;
  const splitSaved = fridayBase ? !fridayMatchesBase(band, fridayBase) : false;
  const [split, setSplit] = useState(splitSaved);

  useEffect(() => {
    if (splitSaved) setSplit(true);
  }, [splitSaved]);

  function setFridaySplit(checked: boolean) {
    setSplit(checked);
    if (!fridayBase) return;
    if (checked && !splitSaved) {
      const current = shownWindow(band, fridayBase);
      onChange({
        ...band,
        friday: {
          mode: "custom",
          window: band.friday.window ?? current,
        },
        ...(fridayBase === "weekend" && band.weekend.mode !== "custom"
          ? { weekend: { mode: "custom" as const, window: current } }
          : {}),
      });
      return;
    }
    if (!checked && splitSaved) {
      onChange({
        ...band,
        friday: { mode: fridayBase === "weekend" ? "weekend" : "weekday" },
      });
    }
  }

  function writeShared(window: TimingWindow) {
    if (fridayBase === "weekend") {
      onChange({
        ...band,
        friday: { mode: "weekend" },
        weekend: { mode: "custom", window },
      });
      return;
    }
    onChange({
      ...band,
      weekday: window,
      friday: { mode: "weekday" },
    });
  }

  function writeSingle(target: HourBand, window: TimingWindow) {
    if (target === "weekday") onChange({ ...band, weekday: window });
    else if (target === "friday") {
      onChange({ ...band, friday: { mode: "custom", window } });
    } else {
      onChange({ ...band, weekend: { mode: "custom", window } });
    }
  }

  const single = bands.length === 1 ? bands[0] : undefined;
  const paired = hasWeekday && hasWeekend && !hasFriday;

  return (
    <div className="space-y-2 border-t border-zinc-100 pt-2">
      <div>
        <h4 className="text-xs font-medium text-zinc-900">{title}</h4>
        <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
          {formatDayList(days)} only
        </p>
      </div>

      {single && (
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-zinc-700">
            {bandDayLabel(days, single)}
          </span>
          <WindowFields
            id={`${id}-${single}`}
            window={shownWindow(band, single)}
            onChange={(window) => writeSingle(single, window)}
          />
        </div>
      )}

      {fridayBase && !split && (
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-zinc-700">
            {formatDayList(days)}
          </span>
          <WindowFields
            id={`${id}-shared`}
            window={shownWindow(band, fridayBase)}
            onChange={writeShared}
          />
        </div>
      )}

      {fridayBase && (
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={split}
            onChange={(e) => setFridaySplit(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
          />
          <span className="text-[11px] font-medium text-zinc-700">
            Different hours on Friday
          </span>
        </label>
      )}

      {fridayBase && split && (
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-zinc-700">
              {bandDayLabel(days, "friday")}
            </span>
            <WindowFields
              id={`${id}-friday`}
              window={band.friday.window ?? shownWindow(band, fridayBase)}
              onChange={(window) =>
                onChange({ ...band, friday: { mode: "custom", window } })
              }
            />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-zinc-700">
              {bandDayLabel(days, fridayBase)}
            </span>
            <WindowFields
              id={`${id}-${fridayBase}`}
              window={
                fridayBase === "weekend" ? shownWindow(band, "weekend") : band.weekday
              }
              onChange={(window) =>
                fridayBase === "weekend"
                  ? onChange({ ...band, weekend: { mode: "custom", window } })
                  : onChange({ ...band, weekday: window })
              }
            />
          </div>
        </div>
      )}

      {paired && (
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-zinc-700">
              {bandDayLabel(days, "weekday")}
            </span>
            <WindowFields
              id={`${id}-weekday`}
              window={band.weekday}
              onChange={(weekday) => onChange({ ...band, weekday })}
            />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-zinc-700">
              {bandDayLabel(days, "weekend")}
            </span>
            <WindowFields
              id={`${id}-weekend`}
              window={shownWindow(band, "weekend")}
              onChange={(window) =>
                onChange({ ...band, weekend: { mode: "custom", window } })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

function BandHoursEditor({
  offeredDays,
  ...rest
}: {
  id: string;
  title: string;
  description: string;
  band: TimingBandHours;
  offeredDays?: string[];
  onChange: (next: TimingBandHours) => void;
}) {
  const bands = offeredHourBands(offeredDays);
  if (bands !== "all" && offeredDays && offeredDays.length > 0) {
    return (
      <LimitedDayHours
        id={rest.id}
        title={rest.title}
        days={offeredDays}
        bands={bands}
        band={rest.band}
        onChange={rest.onChange}
      />
    );
  }
  return <AllDayHours {...rest} />;
}

function AllDayHours({
  id,
  title,
  description,
  band,
  onChange,
}: {
  id: string;
  title: string;
  description: string;
  band: TimingBandHours;
  onChange: (next: TimingBandHours) => void;
}) {
  const splitSaved = hoursAreSplit(band);
  const [split, setSplit] = useState(splitSaved);

  useEffect(() => {
    if (splitSaved) setSplit(true);
  }, [splitSaved]);

  function setSplitHours(checked: boolean) {
    setSplit(checked);
    if (!checked && splitSaved) {
      onChange({
        weekday: band.weekday,
        friday: { mode: "weekday" },
        weekend: { mode: "weekday" },
      });
    }
  }

  function setFridayMode(mode: TimingBandHours["friday"]["mode"]) {
    const friday: TimingBandHours["friday"] =
      mode === "custom"
        ? {
            mode,
            window: band.friday.window ?? band.weekend.window ?? band.weekday,
          }
        : { mode };
    onChange({ ...band, friday });
  }

  function setWeekendMode(mode: TimingBandHours["weekend"]["mode"]) {
    const weekend: TimingBandHours["weekend"] =
      mode === "custom"
        ? { mode, window: band.weekend.window ?? band.weekday }
        : { mode };
    onChange({ ...band, weekend });
  }

  const fridayFollowsClosedWeekend =
    band.friday.mode === "weekend" && band.weekend.mode === "closed";

  return (
    <div className="space-y-2 border-t border-zinc-100 pt-2">
      <div>
        <h4 className="text-xs font-medium text-zinc-900">{title}</h4>
        <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
          {split
            ? "Mon–Thu is the default. Friday and the weekend can follow it or use their own range."
            : description}
        </p>
      </div>

      <div className="space-y-1">
        {split && (
          <span className="text-[11px] font-medium text-zinc-700">Mon–Thu</span>
        )}
        <WindowFields
          id={`${id}-weekday`}
          window={band.weekday}
          onChange={(weekday) => onChange({ ...band, weekday })}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={split}
          onChange={(e) => setSplitHours(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
        />
        <span className="text-[11px] font-medium text-zinc-700">
          Different Friday or weekend hours
        </span>
      </label>

      {split && (
        <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-zinc-700">Friday</span>
            <ModeButtons
              label={`${title} Friday hours`}
              value={band.friday.mode}
              options={FRIDAY_MODES}
              onChange={setFridayMode}
            />
            {band.friday.mode === "custom" && band.friday.window && (
              <WindowFields
                id={`${id}-friday`}
                window={band.friday.window}
                onChange={(window) =>
                  onChange({ ...band, friday: { mode: "custom", window } })
                }
              />
            )}
            {fridayFollowsClosedWeekend && (
              <p className="text-[11px] leading-snug text-zinc-500">
                Friday is closed because the weekend is closed.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-zinc-700">Sat–Sun</span>
            <ModeButtons
              label={`${title} weekend hours`}
              value={band.weekend.mode}
              options={WEEKEND_MODES}
              onChange={setWeekendMode}
            />
            {band.weekend.mode === "custom" && band.weekend.window && (
              <WindowFields
                id={`${id}-weekend`}
                window={band.weekend.window}
                onChange={(window) =>
                  onChange({ ...band, weekend: { mode: "custom", window } })
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TimingStyleEditor({ draft, update }: Props) {
  const current = (draft.timing_style || "standard") as TimingStyle;
  const stored = draft.timing_hours;
  const standard = stored ?? defaultTimingHours();
  const isMeal = current === "meal_service";

  function commit(next: TimingHours) {
    update({ timing_hours: next });
  }

  function commitStandard(next: TimingBandHours) {
    commit({
      ...next,
      ...(stored?.lunch ? { lunch: stored.lunch } : {}),
      ...(stored?.dinner ? { dinner: stored.dinner } : {}),
    });
  }

  function commitMeal(meal: "lunch" | "dinner", next: TimingBandHours) {
    commit({ ...(stored ?? defaultTimingHours()), [meal]: next });
  }

  return (
    <section className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Timing</h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            Choose one. Guests see that version only.
          </p>
        </div>
        <RequiredCheckbox
          checked={fieldIsRequired(draft, "timing")}
          onChange={(required) =>
            setFieldRequired(draft, update, "timing", required)
          }
        />
      </div>

      <div role="radiogroup" aria-label="Timing questions" className="space-y-1.5">
        {OPTIONS.map((opt) => {
          const selected = current === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => update({ timing_style: opt.value })}
              className={`flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors ${
                selected
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <span
                className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                  selected ? "border-zinc-900" : "border-zinc-300"
                }`}
              >
                {selected && (
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
                )}
              </span>
              <span>
                <span className="block text-xs font-medium text-zinc-900">
                  {opt.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
                  {opt.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {isMeal && (
        <p className="text-[11px] leading-snug text-zinc-500">
          Set when lunch and dinner are available with the eye icon on this step.
        </p>
      )}

      {isMeal ? (
        <>
          <BandHoursEditor
            id="lunch-hours"
            title="Lunch hours"
            description="Guests see start times inside this range. An earlier end runs past midnight."
            offeredDays={
              draftFromAvailabilityRules(draft.form_rules, "mealService", "lunch")
                ?.daysOfWeek
            }
            band={stored?.lunch ?? defaultMealHours("lunch")}
            onChange={(next) => commitMeal("lunch", next)}
          />
          <BandHoursEditor
            id="dinner-hours"
            title="Dinner hours"
            description="Guests see start times inside this range. An earlier end runs past midnight."
            offeredDays={
              draftFromAvailabilityRules(draft.form_rules, "mealService", "dinner")
                ?.daysOfWeek
            }
            band={stored?.dinner ?? defaultMealHours("dinner")}
            onChange={(next) => commitMeal("dinner", next)}
          />
        </>
      ) : (
        <BandHoursEditor
          id="bookable-hours"
          title="Bookable times"
          description="Guests only see times in this range. An earlier end runs past midnight."
          band={standard}
          onChange={commitStandard}
        />
      )}
    </section>
  );
}
