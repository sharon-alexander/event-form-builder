import type { FormData } from "../types";
import type { FieldId, LocationConfig, StepId } from "../locations/types";

export type { FieldId };

export type CatalogField = {
  id: FieldId;
  stepId: StepId;
  label: string;
  defaultRequired: boolean;
  /** Locked fields cannot be toggled in admin (Tripleseat). */
  locked?: boolean;
};

export const FIELD_CATALOG: CatalogField[] = [
  { id: "bookingType", stepId: "event_type", label: "Booking type", defaultRequired: true },
  { id: "guestCount", stepId: "headcount", label: "Estimated headcount", defaultRequired: true },
  { id: "eventCategory", stepId: "event_format", label: "Event type", defaultRequired: true },
  { id: "eventFormat", stepId: "event_format", label: "Format", defaultRequired: true },
  { id: "eventDate", stepId: "event_date", label: "Event date", defaultRequired: true },
  { id: "backupDate", stepId: "event_date", label: "Backup date", defaultRequired: false },
  { id: "preferredDays", stepId: "event_date", label: "Preferred days", defaultRequired: false },
  { id: "budget", stepId: "budget", label: "Budget range", defaultRequired: true },
  { id: "venueSpace", stepId: "venue_space", label: "Venue space", defaultRequired: true },
  { id: "timing", stepId: "timing", label: "Timing", defaultRequired: true },
  { id: "services", stepId: "services", label: "Add-on services", defaultRequired: false },
  {
    id: "infoAcknowledged",
    stepId: "info_acknowledge",
    label: "I Understand",
    defaultRequired: true,
  },
  {
    id: "consideringOtherVenues",
    stepId: "other_venues_referral",
    label: "Considering any other venues?",
    defaultRequired: true,
  },
  {
    id: "otherVenuesDetails",
    stepId: "other_venues_referral",
    label: "Which venues are you considering?",
    defaultRequired: false,
  },
  {
    id: "referralSource",
    stepId: "other_venues_referral",
    label: "How did you hear about us?",
    defaultRequired: true,
  },
  {
    id: "firstName",
    stepId: "contact",
    label: "First name",
    defaultRequired: true,
    locked: true,
  },
  {
    id: "lastName",
    stepId: "contact",
    label: "Last name",
    defaultRequired: true,
    locked: true,
  },
  { id: "email", stepId: "contact", label: "Email", defaultRequired: true, locked: true },
  { id: "phone", stepId: "contact", label: "Phone", defaultRequired: true, locked: true },
  { id: "company", stepId: "contact", label: "Company", defaultRequired: false },
  {
    id: "preferredSiteVisitDates",
    stepId: "contact",
    label: "Preferred site visit dates",
    defaultRequired: false,
  },
  {
    id: "additionalNotes",
    stepId: "contact",
    label: "Additional notes",
    defaultRequired: false,
  },
];

const FIELD_BY_ID = new Map(FIELD_CATALOG.map((field) => [field.id, field]));
const FIELD_ID_SET = new Set<string>(FIELD_CATALOG.map((field) => field.id));

export function fieldsForStep(stepId: StepId): CatalogField[] {
  return FIELD_CATALOG.filter((field) => field.stepId === stepId);
}

export function parseRequiredFields(
  raw: unknown,
): Partial<Record<FieldId, boolean>> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Partial<Record<FieldId, boolean>> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (FIELD_ID_SET.has(key) && typeof value === "boolean") {
      out[key as FieldId] = value;
    }
  }
  return out;
}

export function isFieldRequired(
  location: Pick<LocationConfig, "requiredFields"> | null | undefined,
  fieldId: FieldId,
): boolean {
  const field = FIELD_BY_ID.get(fieldId);
  if (!field) return false;
  if (field.locked) return true;
  return location?.requiredFields?.[fieldId] ?? field.defaultRequired;
}

function isFilled(
  fieldId: FieldId,
  data: FormData,
  location: Pick<LocationConfig, "timingStyle">,
): boolean {
  switch (fieldId) {
    case "bookingType":
      return data.bookingType !== null;
    case "guestCount":
      return data.guestCount != null && data.guestCount > 0;
    case "eventCategory":
      return (
        data.eventCategory !== null &&
        (data.eventCategory !== "other" || data.eventCategoryOther.trim() !== "")
      );
    case "eventFormat":
      return data.eventFormat !== null;
    case "eventDate":
      return data.datesFlexible
        ? data.flexibleDatePreferences.preferredMonths.length > 0
        : data.eventDate !== "";
    case "backupDate":
      return data.datesFlexible || data.backupDate !== "";
    case "preferredDays":
      return !data.datesFlexible || data.flexibleDatePreferences.preferredDays.length > 0;
    case "budget":
      return data.budget !== null;
    case "venueSpace":
      return data.venueSpace.length > 0;
    case "timing":
      if (location.timingStyle === "meal_service") {
        return data.mealService !== null && data.startTime !== "";
      }
      return (
        data.timingFlexible || (data.startTime !== "" && data.endTime !== "")
      );
    case "services":
      return data.services.length > 0;
    case "infoAcknowledged":
      return data.infoAcknowledged;
    case "consideringOtherVenues":
      return data.consideringOtherVenues !== null;
    case "otherVenuesDetails":
      return (
        data.consideringOtherVenues !== true ||
        data.otherVenuesDetails.trim() !== ""
      );
    case "referralSource":
      return (
        data.referralSource !== null &&
        (data.referralSource !== "other" || data.referralSourceOther.trim() !== "")
      );
    case "firstName":
      return data.firstName.trim() !== "";
    case "lastName":
      return data.lastName.trim() !== "";
    case "email":
      return data.email.trim() !== "";
    case "phone":
      return data.phone.trim() !== "";
    case "company":
      return data.company.trim() !== "";
    case "preferredSiteVisitDates":
      return data.preferredSiteVisitDates.trim() !== "";
    case "additionalNotes":
      return data.additionalNotes.trim() !== "";
    default:
      return true;
  }
}

export function isStepValid(
  stepId: StepId,
  data: FormData,
  location: Pick<LocationConfig, "requiredFields" | "timingStyle">,
): boolean {
  return fieldsForStep(stepId).every((field) => {
    if (!isFieldRequired(location, field.id)) return true;
    return isFilled(field.id, data, location);
  });
}
