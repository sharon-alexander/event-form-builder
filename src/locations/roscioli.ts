import { assetUrl } from "../config";
import type { LocationConfig } from "./types";

const roscioli: LocationConfig = {
  id: "roscioli",
  name: "Roscioli",
  formTitle: "Private Events",
  aboutBlurb:
    "An iconic Italian dining destination where tradition meets modern hospitality. Host your next event in our storied space — from intimate wine dinners to celebratory gatherings — with world-class food and service at every turn.",

  galleryMedia: [
    { type: "image", src: assetUrl("/gallery/roscioli/dining-room.png"), alt: "Main dining room" },
    { type: "image", src: assetUrl("/gallery/roscioli/wine-room.png"), alt: "Wine room" },
    { type: "image", src: assetUrl("/gallery/roscioli/bar.png"), alt: "Bar area" },
  ],

  venueSpaces: [
    { value: "main_dining", label: "Main Dining Room", price: "Starting at $5,000" },
    { value: "wine_room", label: "Wine Room", price: "Starting at $3,000" },
    { value: "bar_area", label: "Bar Area", price: "Starting at $2,500" },
    { value: "full_buyout", label: "Full Restaurant Buyout", price: "Starting at $15,000" },
    { value: "not_sure", label: "Not Sure Yet", price: "We'll help you decide" },
  ],

  budgetOptions: [
    { value: "under_5k", label: "Less than $5,000" },
    { value: "5k_10k", label: "$5,000 – $10,000" },
    { value: "10k_15k", label: "$10,000 – $15,000" },
    { value: "15k_plus", label: "$15,000+" },
  ],

  steps: [
    "event_type",
    "event_date",
    "headcount",
    "budget",
    "timing",
    "venue_space",
    "info_acknowledge",
    "other_venues_referral",
    "contact",
  ],

  timingStyle: "meal_service",

  infoPage: {
    title: "Food & Beverage Service",
    intro: "Your event coordinator will work with you to select both food and beverage options.",
    sections: [
      {
        heading: "Food:",
        bullets: [
          "Our menu changes seasonally.",
          "We accommodate most dietary restrictions or allergies.",
        ],
      },
      {
        heading: "Beverages:",
        bullets: [
          "We do not provide liquor or offer cocktails due to our license.",
        ],
      },
    ],
  },

  tripleseat: {
    publicKey: import.meta.env.VITE_ROSCIOLI_TRIPLESEAT_PUBLIC_KEY ?? "",
    leadFormId: import.meta.env.VITE_ROSCIOLI_TRIPLESEAT_LEAD_FORM_ID
      ? Number(import.meta.env.VITE_ROSCIOLI_TRIPLESEAT_LEAD_FORM_ID)
      : undefined,
    locationId: import.meta.env.VITE_ROSCIOLI_TRIPLESEAT_LOCATION_ID
      ? Number(import.meta.env.VITE_ROSCIOLI_TRIPLESEAT_LOCATION_ID)
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

export default roscioli;
