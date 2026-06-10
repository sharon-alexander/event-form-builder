import type { FormData } from "../types";
import {
  EVENT_CATEGORIES,
  EVENT_FORMATS,
  BUDGET_OPTIONS,
  VENUE_SPACES,
  SERVICE_OPTIONS,
  REFERRAL_SOURCES,
} from "../types";
import { REFERRAL_SOURCE_IDS, REFERRAL_OTHER_SOURCE_ID } from "../config";

function labelFor(list: { value: string; label: string }[], val: string | null): string {
  return list.find((i) => i.value === val)?.label ?? "";
}

function buildAdditionalInfo(data: FormData): string {
  const lines: string[] = [];

  if (data.guestCount !== null) {
    lines.push(`Headcount: ${data.guestCount}`);
  }
  lines.push(`Headcount May Change: ${data.headcountMayChange ? "Yes" : "No"}`);

  lines.push(`Format: ${labelFor(EVENT_FORMATS, data.eventFormat)}`);
  lines.push(`Budget: ${labelFor(BUDGET_OPTIONS, data.budget)}`);
  lines.push(`Venue Space: ${labelFor(VENUE_SPACES, data.venueSpace)}`);

  if (data.datesFlexible) {
    lines.push("Dates Flexible: Yes");
    if (data.flexibleDatePreferences.preferredMonths.length > 0) {
      lines.push(`Preferred Months: ${data.flexibleDatePreferences.preferredMonths.join(", ")}`);
    }
    if (data.flexibleDatePreferences.preferredDays.length > 0) {
      lines.push(`Preferred Days: ${data.flexibleDatePreferences.preferredDays.join(", ")}`);
    }
  } else {
    if (data.backupDate) {
      lines.push(`Backup Date: ${data.backupDate}`);
    }
  }

  if (data.timingFlexible) {
    lines.push("Timing Flexible: Yes");
  }

  if (data.services.length > 0) {
    lines.push(`Services: ${data.services.map((s) => labelFor(SERVICE_OPTIONS, s)).join(", ")}`);
  }

  if (data.consideringOtherVenues && data.otherVenuesDetails) {
    lines.push(`Other Venues Considered: ${data.otherVenuesDetails}`);
  }

  if (data.preferredSiteVisitDates) {
    lines.push(`Preferred Site Visit Dates: ${data.preferredSiteVisitDates}`);
  }

  if (data.submittingOnBehalf) {
    lines.push("Submitting on behalf of a client: Yes");
  }

  if (data.additionalNotes) {
    lines.push(`Notes: ${data.additionalNotes}`);
  }

  return lines.join("\n");
}

export interface TripleseatLeadPayload {
  lead: {
    first_name: string;
    last_name: string;
    email_address: string;
    phone_number: string;
    company?: string;
    guest_count: number;
    event_description: string;
    event_date?: string;
    start_time?: string;
    end_time?: string;
    event_style: string;
    additional_information: string;
    location_id?: number;
    referral_source_id?: number;
    referral_source_other?: string;
  };
  // lead_form_id is a top-level parameter, sibling to `lead` (per Tripleseat API).
  lead_form_id?: number;
}

export function buildPayload(
  data: FormData,
  opts?: { locationId?: number; leadFormId?: number },
): TripleseatLeadPayload {
  const eventDescription =
    data.eventCategory === "other"
      ? data.eventCategoryOther
      : labelFor(EVENT_CATEGORIES, data.eventCategory);

  const lead: TripleseatLeadPayload["lead"] = {
    first_name: data.firstName.trim(),
    last_name: data.lastName.trim(),
    email_address: data.email.trim(),
    phone_number: data.phone.trim(),
    guest_count: data.guestCount ?? 0,
    event_description: eventDescription,
    event_style: data.bookingType === "large_party" ? "largeparty" : "onpremise",
    additional_information: buildAdditionalInfo(data),
  };

  if (data.company.trim()) lead.company = data.company.trim();

  if (!data.datesFlexible && data.eventDate) {
    const d = new Date(data.eventDate + "T00:00:00");
    lead.event_date = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  }

  if (!data.timingFlexible) {
    if (data.startTime) lead.start_time = data.startTime;
    if (data.endTime) lead.end_time = data.endTime;
  }

  if (opts?.locationId) lead.location_id = opts.locationId;

  if (data.referralSource) {
    lead.referral_source_id = REFERRAL_SOURCE_IDS[data.referralSource];
    // "Other" / "Blog/Press" map to the native "Other" source, which accepts
    // free text via referral_source_other.
    if (lead.referral_source_id === REFERRAL_OTHER_SOURCE_ID) {
      const otherText =
        data.referralSource === "other"
          ? data.referralSourceOther
          : labelFor(REFERRAL_SOURCES, data.referralSource);
      if (otherText) lead.referral_source_other = otherText;
    }
  }

  const payload: TripleseatLeadPayload = { lead };
  if (opts?.leadFormId) payload.lead_form_id = opts.leadFormId;

  return payload;
}
