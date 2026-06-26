import type { FormData } from "../types";
import {
  EVENT_CATEGORIES,
  EVENT_FORMATS,
  SERVICE_OPTIONS,
  REFERRAL_SOURCES,
  MEAL_SERVICE_OPTIONS,
} from "../types";
import { useLocationConfig } from "../context/LocationContext";

interface EventSummaryProps {
  data: FormData;
}

function label(list: { value: string; label: string }[], val: string | null): string {
  return list.find((i) => i.value === val)?.label ?? "";
}

interface SummaryRow {
  title: string;
  value: string;
}

export default function EventSummary({ data }: EventSummaryProps) {
  const location = useLocationConfig();
  const rows: SummaryRow[] = [];

  if (data.bookingType) {
    rows.push({
      title: "Booking",
      value: data.bookingType === "private_event" ? "Private Event" : "Large Party Booking",
    });
  }

  if (data.guestCount) {
    rows.push({
      title: "Headcount",
      value: `${data.guestCount}${data.headcountMayChange ? " (may change)" : ""}`,
    });
  }

  if (data.eventCategory) {
    rows.push({
      title: "Occasion",
      value:
        data.eventCategory === "other"
          ? data.eventCategoryOther || "Other"
          : label(EVENT_CATEGORIES, data.eventCategory),
    });
  }

  if (data.eventFormat) {
    rows.push({ title: "Format", value: label(EVENT_FORMATS, data.eventFormat) });
  }

  if (data.datesFlexible) {
    const months = data.flexibleDatePreferences.preferredMonths;
    const days = data.flexibleDatePreferences.preferredDays;
    const parts = [months.join(", "), days.join(", ")].filter(Boolean);
    rows.push({
      title: "Date",
      value: parts.length ? `Flexible — ${parts.join("; ")}` : "Flexible",
    });
  } else if (data.eventDate) {
    rows.push({
      title: "Date",
      value: `${data.eventDate}${data.backupDate ? ` (backup ${data.backupDate})` : ""}`,
    });
  }

  if (data.budget) {
    rows.push({ title: "Budget", value: label(location.budgetOptions, data.budget) });
  }

  if (data.venueSpace) {
    rows.push({ title: "Space", value: label(location.venueSpaces, data.venueSpace) });
  }

  if (location.timingStyle === "meal_service" && data.mealService) {
    const mealLabel = label(MEAL_SERVICE_OPTIONS, data.mealService);
    rows.push({
      title: "Timing",
      value: data.startTime ? `${mealLabel} at ${data.startTime}` : mealLabel,
    });
  } else if (data.timingFlexible) {
    rows.push({ title: "Timing", value: "Flexible" });
  } else if (data.startTime || data.endTime) {
    rows.push({
      title: "Timing",
      value: `${data.startTime || "?"} – ${data.endTime || "?"}`,
    });
  }

  if (data.services.length > 0) {
    rows.push({
      title: "Services",
      value: data.services.map((s) => label(SERVICE_OPTIONS, s)).join(", "),
    });
  }

  if (data.consideringOtherVenues !== null) {
    rows.push({
      title: "Other venues",
      value:
        data.consideringOtherVenues && data.otherVenuesDetails
          ? data.otherVenuesDetails
          : data.consideringOtherVenues
            ? "Yes"
            : "No",
    });
  }

  if (data.referralSource) {
    rows.push({
      title: "Heard via",
      value:
        data.referralSource === "other"
          ? data.referralSourceOther || "Other"
          : label(REFERRAL_SOURCES, data.referralSource),
    });
  }

  const name = `${data.firstName} ${data.lastName}`.trim();
  if (name) {
    rows.push({ title: "Name", value: name });
  }

  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
      <h3 className="font-display text-lg font-semibold text-gray-900">Your Event</h3>
      <p className="mt-0.5 text-xs text-gray-500">A running summary of your selections</p>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">
          Your selections will appear here as you go.
        </p>
      ) : (
        <dl className="mt-4 space-y-3">
          {rows.map((row) => (
            <div key={row.title} className="flex flex-col gap-0.5">
              <dt className="text-xs font-medium uppercase tracking-wide text-brand-600">
                {row.title}
              </dt>
              <dd className="text-sm text-gray-900">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
