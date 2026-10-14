export type MediaEmbedProvider = "vimeo";

export interface MediaItem {
  type: "image" | "video" | "embed";
  src: string;
  /** Small image used by admin grids. Public galleries keep using src. */
  thumb?: string;
  poster?: string;
  alt: string;
  /** Required when type is "embed". */
  provider?: MediaEmbedProvider;
}

export interface VenueSpaceOption {
  value: string;
  label: string;
  price: string;
  additionalInfo?: string;
  galleryMedia?: MediaItem[];
}

export interface BudgetOption {
  value: string;
  label: string;
}

export interface EventChoiceOption {
  value: string;
  label: string;
}

export interface InfoPageConfig {
  title: string;
}

export type TimingStyle = "standard" | "meal_service";

/** Inclusive bookable window. An earlier end crosses midnight (5:00 PM–1:00 AM). */
export interface TimingWindow {
  start: string;
  end: string;
}

/** Mon–Thu, with Friday and the weekend able to follow or override it. */
export interface TimingBandHours {
  weekday: TimingWindow;
  friday: { mode: "weekday" | "weekend" | "custom"; window?: TimingWindow };
  weekend: { mode: "weekday" | "custom" | "closed"; window?: TimingWindow };
}

/** Standard bookable window, plus optional lunch and dinner ranges. */
export interface TimingHours extends TimingBandHours {
  lunch?: TimingBandHours;
  dinner?: TimingBandHours;
}

export type StepId =
  | "event_type"
  | "headcount"
  | "event_format"
  | "event_date"
  | "budget"
  | "venue_space"
  | "timing"
  | "services"
  | "info_acknowledge"
  | "other_venues_referral"
  | "contact";

/** Guest-facing questions whose requiredness/visibility can be stored per location. */
export type FieldId =
  | "bookingType"
  | "guestCount"
  | "eventCategory"
  | "eventFormat"
  | "eventDate"
  | "backupDate"
  | "preferredDays"
  | "budget"
  | "venueSpace"
  | "timing"
  | "services"
  | "infoAcknowledged"
  | "consideringOtherVenues"
  | "otherVenuesDetails"
  | "referralSource"
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "company"
  | "preferredSiteVisitDates"
  | "additionalNotes";

/** Fields that form rules can read or target. */
export type RuleFieldRef =
  | "guestCount"
  | "bookingType"
  | "eventDate"
  | "eventCategory"
  | "eventFormat"
  | "budget"
  | "venueSpace"
  | "mealService"
  | "services";

export type RuleConditionOp =
  | "eq"
  | "in"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "weekdayIn";

export type RuleCondition =
  | { all: RuleCondition[] }
  | { any: RuleCondition[] }
  | { not: RuleCondition }
  | {
      field: RuleFieldRef;
      op: RuleConditionOp;
      value?: unknown;
      /** Unanswered still counts as a match. Availability uses this. Messages do not. */
      passIfEmpty?: boolean;
    };

export type RuleEffect =
  | {
      kind: "hideOption";
      field: RuleFieldRef;
      optionValue: string;
      /** Missing on older meal rules means disable. Missing elsewhere means hide. */
      behavior?: "hide" | "disable";
    }
  | { kind: "hideField"; field: FieldId }
  | { kind: "hideStep"; stepId: StepId }
  | {
      kind: "message";
      field: RuleFieldRef;
      html: string;
      severity: "info" | "warn" | "block";
    };

export interface FormRule {
  id: string;
  enabled: boolean;
  when: RuleCondition;
  then: RuleEffect[];
}

export interface FormRulesDocument {
  version: 1;
  rules: FormRule[];
}

/** A guest-count limit stored on the question, not as a show/hide rule. */
export interface NumberLimit {
  value: number;
  messageHtml: string;
  behavior: "warn" | "block";
}

/** Per-question overrides. Missing keys use catalog defaults. */
export interface FieldSettings {
  shown?: boolean;
  required?: boolean;
  min?: NumberLimit;
  max?: NumberLimit;
}

export interface TripleseatConfig {
  publicKey: string;
  leadFormId?: number;
  locationId?: number;
  apiBaseUrl: string;
}

export interface LocationConfig {
  id: string;
  name: string;
  formTitle: string;
  aboutBlurb: string;
  /** Public URL of the venue logo, if set on the form theme. */
  logoUrl?: string;
  galleryMedia: MediaItem[];
  venueSpaces: VenueSpaceOption[];
  /** When true, guests can pick more than one space of interest. */
  allowMultipleVenueSpaces?: boolean;
  /** When true, date step shows a multi-day rental interest checkbox. */
  showMultiDayRental?: boolean;
  /** When true, timing step shows an extra load in/out time checkbox. */
  showAdditionalLoadInOut?: boolean;
  /** When true, timing step shows a full-day rental interest checkbox. */
  showFullDayRental?: boolean;
  budgetOptions: BudgetOption[];
  /** Options shown on the event_format step. Undefined = starter catalog. */
  eventCategories?: EventChoiceOption[];
  eventFormats?: EventChoiceOption[];

  /** Ordered list of form steps for this location. */
  steps: StepId[];

  /** Optional "More Details" HTML shown on each step. */
  stepMoreDetails?: Partial<Record<StepId, string>>;

  timingStyle?: TimingStyle;

  /** Null or omitted means the legacy 9:00 AM–11:30 PM window. */
  timingHours?: TimingHours | null;

  /** Title for the info acknowledgement step. */
  infoPage?: InfoPageConfig;

  /** Per-question shown/required overrides. Missing keys use catalog defaults. */
  fieldSettings?: Partial<Record<FieldId, FieldSettings>>;

  /** Versioned conditional rules. Empty means no logic. */
  formRules?: FormRulesDocument;

  tripleseat: TripleseatConfig;
  referralSourceIds: Record<string, number>;
  referralOtherSourceId: number;
}
