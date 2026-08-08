import type { StepId } from "../locations/types";

/** Public form title/subtitle. Optional adminLabel clarifies vague titles in the editor. */
export const DEFAULT_STEP_COPY: Record<
  StepId,
  { title: string; subtitle?: string; adminLabel?: string }
> = {
  event_type: {
    title: "What type of event?",
    subtitle: "Select the booking type that best fits your plans.",
  },
  headcount: {
    title: "How many guests?",
    subtitle: "An estimate is fine — you can let us know if it may change.",
  },
  event_format: {
    title: "Type & format",
    subtitle: "Tell us about the occasion and how you'd like the event set up.",
  },
  event_date: {
    title: "When are you thinking?",
    subtitle: "Pick a date or let us know your flexibility.",
  },
  budget: {
    title: "What's your budget?",
    subtitle: "This helps us recommend the right experience.",
  },
  venue_space: {
    title: "Where would you like to host?",
    subtitle: "Each space has its own character and capacity.",
  },
  timing: {
    title: "Timing",
    subtitle: "Select your preferred start and end times.",
  },
  services: {
    title: "I am interested in…",
    subtitle: "Select all that apply — or skip if none.",
    adminLabel: "I am interested in… (Add-on services)",
  },
  info_acknowledge: {
    title: "Please review",
    adminLabel: "Please review (Info acknowledgement)",
  },
  other_venues_referral: {
    title: "Almost there",
    subtitle: "A couple more questions before we wrap up.",
    adminLabel: "Almost there (Other venues & referral)",
  },
  contact: {
    title: "Your details",
    subtitle: "Tell us a bit about yourself so we can get in touch.",
    adminLabel: "Your details (Contact)",
  },
};
