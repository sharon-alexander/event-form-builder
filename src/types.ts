export type EventBookingType = "private_event" | "large_party";

export type EventCategory =
  | "birthday"
  | "happy_hour"
  | "holiday_party"
  | "corporate"
  | "wedding"
  | "other";

export type EventFormat =
  | "seated"
  | "standing"
  | "seated_and_standing"
  | "not_sure";

export type BudgetRange =
  | "under_5k"
  | "5k_7k"
  | "7k_9k"
  | "10k_plus";

export type VenueSpace =
  | "first_floor_salon"
  | "second_floor_parlor"
  | "third_floor_attic"
  | "parlor_and_attic"
  | "full_buyout"
  | "not_sure";

export type ServiceInterest =
  | "florals"
  | "lighting"
  | "photo_video"
  | "dj_live_music"
  | "custom_branding"
  | "full_production";

export type ReferralSource =
  | "instagram"
  | "tiktok"
  | "facebook"
  | "google"
  | "friend"
  | "blog"
  | "other";

export interface FlexibleDatePreferences {
  preferredMonths: string[];
  preferredDays: string[];
}

export interface FormData {
  bookingType: EventBookingType | null;
  guestCount: number | null;
  headcountMayChange: boolean;

  eventCategory: EventCategory | null;
  eventCategoryOther: string;

  eventFormat: EventFormat | null;

  datesFlexible: boolean;
  eventDate: string;
  backupDate: string;
  flexibleDatePreferences: FlexibleDatePreferences;

  budget: BudgetRange | null;

  venueSpace: VenueSpace | null;

  startTime: string;
  endTime: string;
  timingFlexible: boolean;

  services: ServiceInterest[];

  consideringOtherVenues: boolean | null;
  otherVenuesDetails: string;

  referralSource: ReferralSource | null;
  referralSourceOther: string;

  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  preferredSiteVisitDates: string;
  additionalNotes: string;
  submittingOnBehalf: boolean;
}

export const INITIAL_FORM_DATA: FormData = {
  bookingType: null,
  guestCount: null,
  headcountMayChange: false,

  eventCategory: null,
  eventCategoryOther: "",

  eventFormat: null,

  datesFlexible: false,
  eventDate: "",
  backupDate: "",
  flexibleDatePreferences: { preferredMonths: [], preferredDays: [] },

  budget: null,

  venueSpace: null,

  startTime: "",
  endTime: "",
  timingFlexible: false,

  services: [],

  consideringOtherVenues: null,
  otherVenuesDetails: "",

  referralSource: null,
  referralSourceOther: "",

  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  preferredSiteVisitDates: "",
  additionalNotes: "",
  submittingOnBehalf: false,
};

export const VENUE_SPACES: { value: VenueSpace; label: string; price: string }[] = [
  { value: "first_floor_salon", label: "1st Floor Salon", price: "Starting at $3,000" },
  { value: "second_floor_parlor", label: "2nd Floor Parlor", price: "Starting at $4,000" },
  { value: "third_floor_attic", label: "3rd Floor Attic", price: "Starting at $3,500" },
  { value: "parlor_and_attic", label: "Parlor & Attic", price: "Starting at $6,500" },
  { value: "full_buyout", label: "Full Townhouse Buyout", price: "Starting at $10,000" },
  { value: "not_sure", label: "Not Sure Yet", price: "We'll help you decide" },
];

export const BUDGET_OPTIONS: { value: BudgetRange; label: string }[] = [
  { value: "under_5k", label: "Less than $5,000" },
  { value: "5k_7k", label: "$5,000 – $7,000" },
  { value: "7k_9k", label: "$7,000 – $9,000" },
  { value: "10k_plus", label: "$10,000+" },
];

export const EVENT_CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: "birthday", label: "Birthday" },
  { value: "happy_hour", label: "Happy Hour" },
  { value: "holiday_party", label: "Holiday Party" },
  { value: "corporate", label: "Corporate Event" },
  { value: "wedding", label: "Wedding" },
  { value: "other", label: "Other" },
];

export const EVENT_FORMATS: { value: EventFormat; label: string }[] = [
  { value: "seated", label: "Seated" },
  { value: "standing", label: "Standing" },
  { value: "seated_and_standing", label: "Seated + Standing" },
  { value: "not_sure", label: "Not Sure Yet" },
];

export const SERVICE_OPTIONS: { value: ServiceInterest; label: string }[] = [
  { value: "florals", label: "Florals" },
  { value: "lighting", label: "Lighting" },
  { value: "photo_video", label: "Photography / Videography" },
  { value: "dj_live_music", label: "DJs + Live Music" },
  { value: "custom_branding", label: "Custom Branding Materials" },
  { value: "full_production", label: "Full Event Production" },
];

export const REFERRAL_SOURCES: { value: ReferralSource; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "google", label: "Google" },
  { value: "friend", label: "Friend / Word of Mouth" },
  { value: "blog", label: "Blog / Press" },
  { value: "other", label: "Other" },
];

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];
