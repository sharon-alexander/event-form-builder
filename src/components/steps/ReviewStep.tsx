import type { FormData } from "../../types";
import {
  EVENT_CATEGORIES,
  EVENT_FORMATS,
  SERVICE_OPTIONS,
  REFERRAL_SOURCES,
  MEAL_SERVICE_OPTIONS,
} from "../../types";
import { useLocationConfig } from "../../context/LocationContext";
import FormStep from "../FormStep";

interface Props {
  data: FormData;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
}

function label(list: { value: string; label: string }[], val: string | null): string {
  return list.find((i) => i.value === val)?.label ?? "—";
}

function Row({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
      <dt className="w-48 shrink-0 text-sm font-medium text-gray-500">{title}</dt>
      <dd className="text-sm text-gray-900">{value || "—"}</dd>
    </div>
  );
}

export default function ReviewStep({ data, onSubmit, onBack, isSubmitting, error }: Props) {
  const location = useLocationConfig();

  const bookingLabel =
    data.bookingType === "private_event" ? "Private Event" : "Large Party Booking";

  const categoryLabel =
    data.eventCategory === "other"
      ? data.eventCategoryOther
      : label(EVENT_CATEGORIES, data.eventCategory);

  const dateDisplay = data.datesFlexible
    ? `Flexible — Months: ${data.flexibleDatePreferences.preferredMonths.join(", ") || "Any"}; Days: ${data.flexibleDatePreferences.preferredDays.join(", ") || "Any"}`
    : `${data.eventDate}${data.backupDate ? ` (backup: ${data.backupDate})` : ""}`;

  const timingDisplay =
    location.timingStyle === "meal_service" && data.mealService
      ? data.startTime
        ? `${label(MEAL_SERVICE_OPTIONS, data.mealService)} at ${data.startTime}`
        : label(MEAL_SERVICE_OPTIONS, data.mealService)
      : data.timingFlexible
        ? "Flexible"
        : `${data.startTime} – ${data.endTime}`;

  const servicesDisplay =
    data.services.length > 0
      ? data.services.map((s) => label(SERVICE_OPTIONS, s)).join(", ")
      : "None selected";

  const referralDisplay =
    data.referralSource === "other"
      ? data.referralSourceOther
      : label(REFERRAL_SOURCES, data.referralSource);

  return (
    <FormStep
      title="Review your inquiry"
      subtitle="Please confirm the details below, then submit."
      onNext={onSubmit}
      onBack={onBack}
      nextLabel="Submit Inquiry"
      isSubmitting={isSubmitting}
    >
      <dl className="divide-y divide-gray-100">
        {data.bookingType && <Row title="Booking Type" value={bookingLabel} />}
        {data.guestCount && (
          <Row
            title="Headcount"
            value={`${data.guestCount}${data.headcountMayChange ? " (may change)" : ""}`}
          />
        )}
        {data.eventCategory && <Row title="Event Type" value={categoryLabel} />}
        {data.eventFormat && <Row title="Format" value={label(EVENT_FORMATS, data.eventFormat)} />}
        {dateDisplay && <Row title="Date" value={dateDisplay} />}
        {data.budget && <Row title="Budget" value={label(location.budgetOptions, data.budget)} />}
        {data.venueSpace && (
          <Row title="Venue Space" value={label(location.venueSpaces, data.venueSpace)} />
        )}
        {(data.startTime || data.timingFlexible || data.mealService) && (
          <Row title="Timing" value={timingDisplay} />
        )}
        {location.steps.includes("services") && (
          <Row title="Services" value={servicesDisplay} />
        )}
        {data.consideringOtherVenues !== null && (
          <Row
            title="Other Venues"
            value={
              data.consideringOtherVenues
                ? `Yes — ${data.otherVenuesDetails}`
                : "No"
            }
          />
        )}
        {data.referralSource && <Row title="Referral" value={referralDisplay} />}
        <Row title="Name" value={`${data.firstName} ${data.lastName}`} />
        <Row title="Email" value={data.email} />
        <Row title="Phone" value={data.phone} />
        {data.company && <Row title="Company" value={data.company} />}
        {data.preferredSiteVisitDates && (
          <Row title="Site Visit Dates" value={data.preferredSiteVisitDates} />
        )}
        {data.additionalNotes && <Row title="Notes" value={data.additionalNotes} />}
        {data.submittingOnBehalf && <Row title="On Behalf of Client" value="Yes" />}
      </dl>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </FormStep>
  );
}
