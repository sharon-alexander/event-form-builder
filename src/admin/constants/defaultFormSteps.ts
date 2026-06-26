import type { StepId } from "../../locations/types";

export const ALL_STEP_IDS: StepId[] = [
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
];

export const DEFAULT_FORM_STEPS: StepId[] = [
  "event_type",
  "headcount",
  "event_date",
  "budget",
  "venue_space",
  "timing",
  "other_venues_referral",
  "contact",
];

export const STEP_LABELS: Record<StepId, string> = {
  event_type: "Event Type",
  headcount: "Headcount",
  event_format: "Type & Format",
  event_date: "Event Date",
  budget: "Budget",
  venue_space: "Venue / Dining",
  timing: "Timing",
  services: "Add-on Services",
  info_acknowledge: "Info Acknowledgement",
  other_venues_referral: "Other Venues & Referral",
  contact: "Contact & Submit",
};
