import type { TimingBandHours, TimingHours, TimingWindow } from "../locations/types";
import {
  DINNER_START_TIMES,
  LUNCH_START_TIMES,
  type FormData,
  type MealService,
} from "../types";

const MINUTES_PER_DAY = 24 * 60;

const WEEKDAY_FROM_INDEX = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export type HourBand = "weekday" | "friday" | "weekend";

type Band = HourBand;

const DAY_BAND: Record<string, Band> = {
  Monday: "weekday",
  Tuesday: "weekday",
  Wednesday: "weekday",
  Thursday: "weekday",
  Friday: "friday",
  Saturday: "weekend",
  Sunday: "weekend",
};

export const LEGACY_WINDOW: TimingWindow = {
  start: "9:00 AM",
  end: "11:30 PM",
};

const LEGACY_LUNCH_WINDOW: TimingWindow = {
  start: "11:30 AM",
  end: "1:00 PM",
};

const LEGACY_DINNER_WINDOW: TimingWindow = {
  start: "5:00 PM",
  end: "10:00 PM",
};

export type TimingDateInput = Pick<
  FormData,
  "datesFlexible" | "eventDate" | "flexibleDatePreferences"
>;

export interface ResolvedTiming {
  /** The guest's date, or every preferred day, falls on a closed band. */
  closed: boolean;
  /** Inclusive 30-minute labels, in order. Empty when closed. */
  slots: string[];
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

/** Minutes from midnight, or null when the label is not a 30-minute clock time. */
export function parseClock(label: string): number | null {
  const match = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(label.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const suffix = match[3];
  if (
    !Number.isInteger(hour) ||
    hour < 1 ||
    hour > 12 ||
    (minute !== 0 && minute !== 30) ||
    !suffix
  ) {
    return null;
  }
  let h24 = hour % 12;
  if (suffix === "PM") h24 += 12;
  return h24 * 60 + minute;
}

export function formatClock(minutes: number): string {
  const normalized =
    ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const hour = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${hour}:${minute === 0 ? "00" : "30"} ${suffix}`;
}

function clockGrid(start: number, end: number): string[] {
  const slots: string[] = [];
  for (let t = start; t <= end; t += 30) slots.push(formatClock(t));
  return slots;
}

/** Admin pickers: 7:00 AM through 1:00 AM. */
export const ADMIN_TIME_OPTIONS = clockGrid(7 * 60, 25 * 60);

const LEGACY_SLOTS = clockGrid(9 * 60, 23 * 60 + 30);

export function defaultTimingHours(): TimingHours {
  return {
    weekday: { ...LEGACY_WINDOW },
    friday: { mode: "weekday" },
    weekend: { mode: "weekday" },
  };
}

/** Shown until an admin saves a meal range. Matches the old hardcoded lists. */
export function defaultMealHours(meal: MealService): TimingBandHours {
  return {
    weekday: {
      ...(meal === "lunch" ? LEGACY_LUNCH_WINDOW : LEGACY_DINNER_WINDOW),
    },
    friday: { mode: "weekday" },
    weekend: { mode: "weekday" },
  };
}

export function hoursAreSplit(
  hours: TimingBandHours | null | undefined,
): boolean {
  if (!hours) return false;
  return hours.friday.mode !== "weekday" || hours.weekend.mode !== "weekday";
}

function parseWindow(raw: unknown): TimingWindow | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const start = (raw as { start?: unknown }).start;
  const end = (raw as { end?: unknown }).end;
  if (typeof start !== "string" || typeof end !== "string") return null;
  if (parseClock(start) == null || parseClock(end) == null) return null;
  return { start, end };
}

function parseFriday(raw: unknown): TimingBandHours["friday"] | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const mode = (raw as { mode?: unknown }).mode;
  if (mode !== "weekday" && mode !== "weekend" && mode !== "custom") return null;
  if (mode !== "custom") return { mode };
  const window = parseWindow((raw as { window?: unknown }).window);
  return window ? { mode: "custom", window } : { mode: "weekday" };
}

function parseWeekend(raw: unknown): TimingBandHours["weekend"] | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const mode = (raw as { mode?: unknown }).mode;
  if (mode !== "weekday" && mode !== "custom" && mode !== "closed") return null;
  if (mode !== "custom") return { mode };
  const window = parseWindow((raw as { window?: unknown }).window);
  return window ? { mode: "custom", window } : { mode: "weekday" };
}

function parseBand(raw: unknown): TimingBandHours | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const rec = raw as Record<string, unknown>;
  const weekday = parseWindow(rec.weekday);
  if (!weekday) return null;
  return {
    weekday,
    friday: parseFriday(rec.friday) ?? { mode: "weekday" },
    weekend: parseWeekend(rec.weekend) ?? { mode: "weekday" },
  };
}

/** Null when hours were never customized or the stored value is unusable. */
export function parseTimingHours(raw: unknown): TimingHours | null {
  const band = parseBand(raw);
  if (!band || !raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const rec = raw as Record<string, unknown>;
  const lunch = parseBand(rec.lunch);
  const dinner = parseBand(rec.dinner);
  return {
    ...band,
    ...(lunch ? { lunch } : {}),
    ...(dinner ? { dinner } : {}),
  };
}

const BAND_ORDER: HourBand[] = ["weekday", "friday", "weekend"];

/** No day list, or days in every band, keeps the full Mon–Thu / Friday / weekend editor. */
export function offeredHourBands(
  days: string[] | null | undefined,
): HourBand[] | "all" {
  if (!days || days.length === 0) return "all";
  const present = new Set<HourBand>();
  for (const day of days) {
    const band = DAY_BAND[day];
    if (band) present.add(band);
  }
  if (present.size === 0 || present.size === 3) return "all";
  return BAND_ORDER.filter((band) => present.has(band));
}

/** Hours guests see for one band. Null when that band is closed. */
export function bandWindow(
  hours: TimingBandHours,
  band: HourBand,
): TimingWindow | null {
  return windowForBand(hours, band);
}

function windowForBand(hours: TimingBandHours, band: Band): TimingWindow | null {
  if (band === "weekday") return hours.weekday;
  if (band === "weekend") {
    if (hours.weekend.mode === "closed") return null;
    if (hours.weekend.mode === "custom" && hours.weekend.window) {
      return hours.weekend.window;
    }
    return hours.weekday;
  }
  if (hours.friday.mode === "custom" && hours.friday.window) return hours.friday.window;
  if (hours.friday.mode === "weekend") return windowForBand(hours, "weekend");
  return hours.weekday;
}

function bandsForDate(data: TimingDateInput): Band[] {
  if (!data.datesFlexible && data.eventDate) {
    const day = weekdayFromEventDate(data.eventDate);
    const band = day ? DAY_BAND[day] : undefined;
    if (band) return [band];
  }
  if (data.datesFlexible && data.flexibleDatePreferences.preferredDays.length > 0) {
    const bands: Band[] = [];
    const seen = new Set<Band>();
    for (const day of data.flexibleDatePreferences.preferredDays) {
      const band = DAY_BAND[day];
      if (!band || seen.has(band)) continue;
      seen.add(band);
      bands.push(band);
    }
    if (bands.length > 0) return bands;
  }
  return ["weekday", "friday", "weekend"];
}

function slotsForWindows(windows: TimingWindow[]): string[] {
  const order = new Map<string, number>();
  for (const window of windows) {
    const start = parseClock(window.start);
    const end = parseClock(window.end);
    if (start == null || end == null) continue;
    const endAt = end < start ? end + MINUTES_PER_DAY : end;
    for (let t = start; t <= endAt; t += 30) {
      const label = formatClock(t);
      const prev = order.get(label);
      if (prev == null || t < prev) order.set(label, t);
    }
  }
  return [...order.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([label]) => label);
}

export function resolveTimingSlots(
  hours: TimingBandHours | null | undefined,
  data: TimingDateInput,
): ResolvedTiming {
  if (!hours) return { closed: false, slots: LEGACY_SLOTS };
  const windows = bandsForDate(data)
    .map((band) => windowForBand(hours, band))
    .filter((window): window is TimingWindow => window != null);
  if (windows.length === 0) return { closed: true, slots: [] };
  return { closed: false, slots: slotsForWindows(windows) };
}

/** End choices strictly after the selected start. The full list until a start is chosen. */
export function endTimeOptions(slots: string[], startTime: string): string[] {
  if (!startTime) return slots;
  const index = slots.indexOf(startTime);
  if (index === -1) return slots;
  return slots.slice(index + 1);
}

function legacyMealSlots(
  meal: MealService,
  hours: TimingHours,
  data: TimingDateInput,
): string[] {
  const catalog = meal === "lunch" ? LUNCH_START_TIMES : DINNER_START_TIMES;
  const resolved = resolveTimingSlots(hours, data);
  if (resolved.closed) return [];
  const allowed = new Set(resolved.slots);
  return catalog.filter((time) => allowed.has(time));
}

/** A saved meal range, or the old list clipped to the standard window. */
export function mealStartOptions(
  meal: MealService,
  hours: TimingHours | null | undefined,
  data: TimingDateInput,
): string[] {
  const catalog = meal === "lunch" ? LUNCH_START_TIMES : DINNER_START_TIMES;
  if (!hours) return catalog;
  const band = meal === "lunch" ? hours.lunch : hours.dinner;
  if (!band) return legacyMealSlots(meal, hours, data);
  const resolved = resolveTimingSlots(band, data);
  return resolved.closed ? [] : resolved.slots;
}

/** Drop times the current date no longer allows. */
export function clearedTimingFields(
  hours: TimingHours | null | undefined,
  data: FormData,
  timingStyle: "standard" | "meal_service" | undefined,
): Partial<FormData> | null {
  if (!hours) return null;

  if (timingStyle === "meal_service") {
    if (!data.mealService) return null;
    const times = mealStartOptions(data.mealService, hours, data);
    if (times.length === 0) {
      return { mealService: null, startTime: "", endTime: "" };
    }
    if (data.startTime && !times.includes(data.startTime)) {
      return { startTime: "" };
    }
    return null;
  }

  const resolved = resolveTimingSlots(hours, data);
  if (resolved.closed) {
    if (!data.startTime && !data.endTime && data.mealService == null) return null;
    return { startTime: "", endTime: "", mealService: null };
  }

  const patch: Partial<FormData> = {};
  let start = data.startTime;
  if (start && !resolved.slots.includes(start)) {
    patch.startTime = "";
    patch.endTime = "";
    start = "";
  } else if (
    data.endTime &&
    !endTimeOptions(resolved.slots, start).includes(data.endTime)
  ) {
    patch.endTime = "";
  }

  return Object.keys(patch).length > 0 ? patch : null;
}
