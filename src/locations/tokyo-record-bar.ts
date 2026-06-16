import { assetUrl } from "../config";
import type { LocationConfig } from "./types";

const tokyoRecordBar: LocationConfig = {
  id: "tokyo-record-bar",
  name: "Tokyo Record Bar",
  formTitle: "Private Events",
  aboutBlurb:
    "A one-of-a-kind listening experience meets world-class Japanese-inspired cuisine. Host your next event surrounded by vinyl, incredible sound, and an intimate atmosphere unlike any other venue in the city.",

  galleryMedia: [
    // Replace with actual Tokyo Record Bar venue images
    { type: "image", src: assetUrl("/gallery/tokyo-record-bar/listening-room.png"), alt: "Listening room" },
    { type: "image", src: assetUrl("/gallery/tokyo-record-bar/bar.png"), alt: "Bar area" },
    { type: "image", src: assetUrl("/gallery/tokyo-record-bar/lounge.png"), alt: "Lounge area" },
  ],

  venueSpaces: [
    { value: "listening_room", label: "Listening Room", price: "Starting at $3,500" },
    { value: "bar_lounge", label: "Bar & Lounge", price: "Starting at $2,500" },
    { value: "full_buyout", label: "Full Venue Buyout", price: "Starting at $8,000" },
    { value: "not_sure", label: "Not Sure Yet", price: "We'll help you decide" },
  ],

  budgetOptions: [
    { value: "under_3k", label: "Less than $3,000" },
    { value: "3k_5k", label: "$3,000 – $5,000" },
    { value: "5k_8k", label: "$5,000 – $8,000" },
    { value: "8k_plus", label: "$8,000+" },
  ],

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

  // Confirm these IDs via Tripleseat API for the Tokyo Record Bar site
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
