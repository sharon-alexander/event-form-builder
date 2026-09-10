export interface MediaItem {
  type: "image" | "video";
  src: string;
  poster?: string;
  alt: string;
}

export interface VenueSpaceOption {
  value: string;
  label: string;
  price: string;
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

/** Guest-facing questions whose requiredness can be stored per location. */
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

  /** Title for the info acknowledgement step. */
  infoPage?: InfoPageConfig;

  /** Per-question required overrides. Missing keys use catalog defaults. */
  requiredFields?: Partial<Record<FieldId, boolean>>;

  tripleseat: TripleseatConfig;
  referralSourceIds: Record<string, number>;
  referralOtherSourceId: number;
}
