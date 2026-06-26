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

export interface InfoPageSection {
  heading?: string;
  body?: string;
  bullets?: string[];
}

export interface InfoPageConfig {
  title: string;
  intro?: string;
  sections?: InfoPageSection[];
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
  galleryMedia: MediaItem[];
  venueSpaces: VenueSpaceOption[];
  budgetOptions: BudgetOption[];

  /** Ordered list of form steps for this location. */
  steps: StepId[];

  /** Optional read-only "More Details" text shown below each step's inputs. */
  stepMoreDetails?: Partial<Record<StepId, string>>;

  timingStyle?: TimingStyle;

  /** Content for the info acknowledgement step (Roscioli). */
  infoPage?: InfoPageConfig;

  /** Override labels/copy for specific steps. */
  stepCopy?: Partial<Record<StepId, { title?: string; subtitle?: string }>>;

  tripleseat: TripleseatConfig;
  referralSourceIds: Record<string, number>;
  referralOtherSourceId: number;
}
