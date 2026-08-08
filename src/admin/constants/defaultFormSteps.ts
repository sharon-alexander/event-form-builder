import type { StepId } from "../../locations/types";
import { DEFAULT_STEP_COPY } from "../../form/defaultStepCopy";

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

export const STEP_LABELS: Record<StepId, string> = Object.fromEntries(
  ALL_STEP_IDS.map((id) => {
    const copy = DEFAULT_STEP_COPY[id];
    return [id, copy.adminLabel ?? copy.title];
  }),
) as Record<StepId, string>;
