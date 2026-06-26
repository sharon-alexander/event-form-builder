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

export type MealService = "lunch" | "dinner";

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

  budget: string | null;
  venueSpace: string | null;

  startTime: string;
  endTime: string;
  timingFlexible: boolean;
  mealService: MealService | null;

  services: ServiceInterest[];

  infoAcknowledged: boolean;

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
  mealService: null,

  services: [],

  infoAcknowledged: false,

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

export const MEAL_SERVICE_OPTIONS: { value: MealService; label: string; note?: string }[] = [
  { value: "lunch", label: "Lunch", note: "Friday – Sunday only" },
  { value: "dinner", label: "Dinner" },
];

export const LUNCH_START_TIMES = [
  "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM",
];

export const DINNER_START_TIMES = [
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM",
  "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM",
];
