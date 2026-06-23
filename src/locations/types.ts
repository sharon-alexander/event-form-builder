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
}

export interface BudgetOption {
  value: string;
  label: string;
}

export interface TripleseatConfig {
  publicKey: string;
  leadFormId?: number;
  locationId?: number;
  apiBaseUrl: string;
}

export interface LocationConfig {
  /** URL-safe slug used for routing and data attributes, e.g. "pearl-box" */
  id: string;

  /** Display name shown in the form header, e.g. "Pearl Box Townhouse" */
  name: string;

  /** Small label above the venue name, e.g. "Private Events" */
  formTitle: string;

  /** Paragraph shown on the landing page below the venue name */
  aboutBlurb: string;

  /** Gallery media items shown on the landing page */
  galleryMedia: MediaItem[];

  /** Venue space options for the VenueSpaceStep */
  venueSpaces: VenueSpaceOption[];

  /** Budget range options for the BudgetStep */
  budgetOptions: BudgetOption[];

  /** Tripleseat API credentials and IDs for lead submission */
  tripleseat: TripleseatConfig;

  /**
   * Maps each referral source value to a Tripleseat referral_source_id.
   * Populated at runtime via resolveReferralSources() — not CMS-editable.
   */
  referralSourceIds: Record<string, number>;

  /** The Tripleseat referral_source_id that represents "Other" (free text). */
  referralOtherSourceId: number;
}
