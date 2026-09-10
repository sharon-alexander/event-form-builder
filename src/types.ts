export type EventBookingType = "private_event" | "large_party";

export type EventCategory =
  | "birthday"
  | "brand_activations"
  | "corporate"
  | "engagement_party"
  | "going_away_party"
  | "happy_hour"
  | "holiday_party"
  | "intimate_weddings"
  | "listening_parties"
  | "networking_event"
  | "personal_celebrations"
  | "pop_ups"
  | "private_dinners"
  | "product_launches"
  | "rehearsal_dinner"
  | "team_building"
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
  | "eventup"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "venues_by_tripleseat"
  | "google"
  | "email"
  | "friend"
  | "past_guest"
  | "other";

export interface FlexibleDatePreferences {
  preferredMonths: string[];
  preferredDays: string[];
}

export interface FormData {
  bookingType: EventBookingType | null;
  guestCount: number | null;
  headcountMayChange: boolean;

  eventCategory: string | null;
  eventCategoryOther: string;

  eventFormat: string | null;

  datesFlexible: boolean;
  interestedInMultiDayRental: boolean;
  eventDate: string;
  backupDate: string;
  flexibleDatePreferences: FlexibleDatePreferences;

  budget: string | null;
  venueSpace: string[];

  startTime: string;
  endTime: string;
  timingFlexible: boolean;
  additionalLoadInOutNeeded: boolean;
  interestedInFullDayRental: boolean;
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
  interestedInMultiDayRental: false,
  eventDate: "",
  backupDate: "",
  flexibleDatePreferences: { preferredMonths: [], preferredDays: [] },

  budget: null,
  venueSpace: [],

  startTime: "",
  endTime: "",
  timingFlexible: false,
  additionalLoadInOutNeeded: false,
  interestedInFullDayRental: false,
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
  { value: "brand_activations", label: "Brand Activations" },
  { value: "corporate", label: "Corporate Events" },
  { value: "engagement_party", label: "Engagement Party" },
  { value: "going_away_party", label: "Going Away Party" },
  { value: "happy_hour", label: "Happy Hour" },
  { value: "holiday_party", label: "Holiday Party" },
  { value: "intimate_weddings", label: "Intimate Weddings" },
  { value: "listening_parties", label: "Listening Parties" },
  { value: "networking_event", label: "Networking Event" },
  { value: "personal_celebrations", label: "Personal Celebrations" },
  { value: "pop_ups", label: "Pop-ups" },
  { value: "private_dinners", label: "Private Dinners" },
  { value: "product_launches", label: "Product Launches" },
  { value: "rehearsal_dinner", label: "Rehearsal Dinner" },
  { value: "team_building", label: "Team Building" },
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
  { value: "eventup", label: "EventUp" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "venues_by_tripleseat", label: "Venues by Tripleseat" },
  { value: "google", label: "Search Engine" },
  { value: "email", label: "Email" },
  { value: "friend", label: "Friends/Family" },
  { value: "past_guest", label: "Past Guest" },
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
