import { assetUrl } from "../config";
import type { LocationConfig } from "./types";

const pearlBox: LocationConfig = {
  id: "pearl-box",
  name: "Pearl Box Townhouse",
  formTitle: "Private Events",
  aboutBlurb:
    "A landmark townhouse reimagined for unforgettable gatherings. From intimate dinners in the salon to full-buyout celebrations across all three floors, our team handles every detail — florals, lighting, production and more — so you can simply enjoy the moment.",

  galleryMedia: [
    { type: "image", src: assetUrl("/gallery/pearl-box/salon.png"), alt: "The salon with red velvet seating" },
    { type: "image", src: assetUrl("/gallery/pearl-box/attic.png"), alt: "The attic lounge with wood paneling" },
    { type: "image", src: assetUrl("/gallery/pearl-box/staircase.png"), alt: "Mirrored staircase" },
    { type: "image", src: assetUrl("/gallery/pearl-box/staircase-detail.png"), alt: "Staircase detail with red lighting" },
  ],

  venueSpaces: [
    { value: "first_floor_salon", label: "1st Floor Salon", price: "Starting at $3,000" },
    { value: "second_floor_parlor", label: "2nd Floor Parlor", price: "Starting at $4,000" },
    { value: "third_floor_attic", label: "3rd Floor Attic", price: "Starting at $3,500" },
    { value: "parlor_and_attic", label: "Parlor & Attic", price: "Starting at $6,500" },
    { value: "full_buyout", label: "Full Townhouse Buyout", price: "Starting at $10,000" },
    { value: "not_sure", label: "Not Sure Yet", price: "We'll help you decide" },
  ],

  budgetOptions: [
    { value: "under_5k", label: "Less than $5,000" },
    { value: "5k_7k", label: "$5,000 – $7,000" },
    { value: "7k_9k", label: "$7,000 – $9,000" },
    { value: "10k_plus", label: "$10,000+" },
  ],

  tripleseat: {
    publicKey: import.meta.env.VITE_PEARL_BOX_TRIPLESEAT_PUBLIC_KEY ?? "",
    leadFormId: import.meta.env.VITE_PEARL_BOX_TRIPLESEAT_LEAD_FORM_ID
      ? Number(import.meta.env.VITE_PEARL_BOX_TRIPLESEAT_LEAD_FORM_ID)
      : undefined,
    locationId: import.meta.env.VITE_PEARL_BOX_TRIPLESEAT_LOCATION_ID
      ? Number(import.meta.env.VITE_PEARL_BOX_TRIPLESEAT_LOCATION_ID)
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

export default pearlBox;
