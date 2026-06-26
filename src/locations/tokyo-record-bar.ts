import { assetUrl } from "../config";
import type { LocationConfig } from "./types";

const tokyoRecordBar: LocationConfig = {
  id: "tokyo-record-bar",
  name: "Tokyo Record Bar",
  formTitle: "Private Events",
  aboutBlurb:
    "A one-of-a-kind listening experience meets world-class Japanese-inspired cuisine. Host your next event surrounded by vinyl, incredible sound, and an intimate atmosphere unlike any other venue in the city.",

  galleryMedia: [
    { type: "image", src: assetUrl("/gallery/tokyo-record-bar/listening-room.png"), alt: "Listening room" },
    { type: "image", src: assetUrl("/gallery/tokyo-record-bar/bar.png"), alt: "Bar area" },
    { type: "image", src: assetUrl("/gallery/tokyo-record-bar/lounge.png"), alt: "Lounge area" },
  ],

  venueSpaces: [
    { value: "cocktail_bar", label: "Cocktail Bar", price: "Starting at $2,500" },
    { value: "omakase", label: "Omakase", price: "Starting at $3,500" },
    { value: "full_buyout", label: "Full Venue Buyout", price: "Starting at $8,000" },
    { value: "not_sure", label: "Not Sure Yet", price: "We'll help you decide" },
  ],

  budgetOptions: [
    { value: "under_3k", label: "Less than $3,000" },
    { value: "3k_5k", label: "$3,000 – $5,000" },
    { value: "5k_8k", label: "$5,000 – $8,000" },
    { value: "8k_plus", label: "$8,000+" },
  ],

  steps: [
    "event_type",
    "headcount",
    "budget",
    "venue_space",
    "event_date",
    "timing",
    "other_venues_referral",
    "contact",
  ],

  timingStyle: "standard",

  stepCopy: {
    venue_space: {
      title: "Select dining",
      subtitle: "Choose the experience that fits your event.",
    },
  },

  tripleseat: {
    publicKey: import.meta.env.VITE_TRB_TRIPLESEAT_PUBLIC_KEY ?? "",
    leadFormId: import.meta.env.VITE_TRB_TRIPLESEAT_LEAD_FORM_ID
      ? Number(import.meta.env.VITE_TRB_TRIPLESEAT_LEAD_FORM_ID)
      : undefined,
    locationId: import.meta.env.VITE_TRB_TRIPLESEAT_LOCATION_ID
      ? Number(import.meta.env.VITE_TRB_TRIPLESEAT_LOCATION_ID)
      : undefined,
    apiBaseUrl: "https://api.tripleseat.com/v1",
  },

  referralSourceIds: {
    instagram: 6,
    tiktok: 11888,
    facebook: 5,
    google: 3,
    friend: 10746,
    blog: 1,
    other: 1,
  },

  referralOtherSourceId: 1,
};

export default tokyoRecordBar;
