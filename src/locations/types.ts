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
  budgetOptions: BudgetOption[];

  /** Ordered list of form steps for this location. */
  steps: StepId[];

  /** Optional "More Details" HTML shown on each step. */
  stepMoreDetails?: Partial<Record<StepId, string>>;

  timingStyle?: TimingStyle;

  /** Title for the info acknowledgement step. */
  infoPage?: InfoPageConfig;

  /** Override labels/copy for specific steps. */
  stepCopy?: Partial<Record<StepId, { title?: string; subtitle?: string }>>;

  tripleseat: TripleseatConfig;
  referralSourceIds: Record<string, number>;
  referralOtherSourceId: number;
}
