// Seed data for the three launch locations.
//
// This mirrors the original hardcoded configs in src/locations/*.ts. Tripleseat
// credentials intentionally live in env vars rather than here — the seed reads
// them from process.env when present so secrets stay out of source control.
//
// `gallery` lists the image files expected under public/gallery/<slug>/. The seed
// uploads any that exist to Supabase Storage and writes the resulting public URLs
// into each location's gallery_media.

/** @type {import("./seed.mjs").SeedLocation[]} */
export const LOCATIONS = [
  {
    slug: "pearl-box",
    name: "Pearl Box Townhouse",
    form_title: "Private Events",
    about_blurb:
      "A landmark townhouse reimagined for unforgettable gatherings. From intimate dinners in the salon to full-buyout celebrations across all three floors, our team handles every detail — florals, lighting, production and more — so you can simply enjoy the moment.",
    published: true,
    gallery: [
      { file: "salon.png", alt: "The salon with red velvet seating" },
      { file: "attic.png", alt: "The attic lounge with wood paneling" },
      { file: "staircase.png", alt: "Mirrored staircase" },
      { file: "staircase-detail.png", alt: "Staircase detail with red lighting" },
    ],
    venue_spaces: [
      { value: "first_floor_salon", label: "1st Floor Salon", price: "Starting at $3,000" },
      { value: "second_floor_parlor", label: "2nd Floor Parlor", price: "Starting at $4,000" },
      { value: "third_floor_attic", label: "3rd Floor Attic", price: "Starting at $3,500" },
      { value: "parlor_and_attic", label: "Parlor & Attic", price: "Starting at $6,500" },
      { value: "full_buyout", label: "Full Townhouse Buyout", price: "Starting at $10,000" },
      { value: "not_sure", label: "Not Sure Yet", price: "We'll help you decide" },
    ],
    budget_options: [
      { value: "under_5k", label: "Less than $5,000" },
      { value: "5k_7k", label: "$5,000 – $7,000" },
      { value: "7k_9k", label: "$7,000 – $9,000" },
      { value: "10k_plus", label: "$10,000+" },
    ],
    tripleseat: {
      publicKey: process.env.VITE_PEARL_BOX_TRIPLESEAT_PUBLIC_KEY ?? "",
      leadFormId: numOrUndef(process.env.VITE_PEARL_BOX_TRIPLESEAT_LEAD_FORM_ID),
      locationId: numOrUndef(process.env.VITE_PEARL_BOX_TRIPLESEAT_LOCATION_ID),
      apiBaseUrl: "https://api.tripleseat.com/v1",
    },
    referral_source_ids: {
      instagram: 6, tiktok: 11888, facebook: 5, google: 3, friend: 10746, blog: 1, other: 1,
    },
    referral_other_source_id: 1,
    theme: {},
  },
  {
    slug: "roscioli",
    name: "Roscioli",
    form_title: "Private Events",
    about_blurb:
      "An iconic Italian dining destination where tradition meets modern hospitality. Host your next event in our storied space — from intimate wine dinners to celebratory gatherings — with world-class food and service at every turn.",
    published: true,
    gallery: [
      { file: "dining-room.png", alt: "Main dining room" },
      { file: "wine-room.png", alt: "Wine room" },
      { file: "bar.png", alt: "Bar area" },
    ],
    venue_spaces: [
      { value: "main_dining", label: "Main Dining Room", price: "Starting at $5,000" },
      { value: "wine_room", label: "Wine Room", price: "Starting at $3,000" },
      { value: "bar_area", label: "Bar Area", price: "Starting at $2,500" },
      { value: "full_buyout", label: "Full Restaurant Buyout", price: "Starting at $15,000" },
      { value: "not_sure", label: "Not Sure Yet", price: "We'll help you decide" },
    ],
    budget_options: [
      { value: "under_5k", label: "Less than $5,000" },
      { value: "5k_10k", label: "$5,000 – $10,000" },
      { value: "10k_15k", label: "$10,000 – $15,000" },
      { value: "15k_plus", label: "$15,000+" },
    ],
    tripleseat: {
      publicKey: process.env.VITE_ROSCIOLI_TRIPLESEAT_PUBLIC_KEY ?? "",
      leadFormId: numOrUndef(process.env.VITE_ROSCIOLI_TRIPLESEAT_LEAD_FORM_ID),
      locationId: numOrUndef(process.env.VITE_ROSCIOLI_TRIPLESEAT_LOCATION_ID),
      apiBaseUrl: "https://api.tripleseat.com/v1",
    },
    referral_source_ids: {
      instagram: 6, tiktok: 11888, facebook: 5, google: 3, friend: 10746, blog: 1, other: 1,
    },
    referral_other_source_id: 1,
    theme: {},
  },
  {
    slug: "tokyo-record-bar",
    name: "Tokyo Record Bar",
    form_title: "Private Events",
    about_blurb:
      "A one-of-a-kind listening experience meets world-class Japanese-inspired cuisine. Host your next event surrounded by vinyl, incredible sound, and an intimate atmosphere unlike any other venue in the city.",
    published: true,
    gallery: [
      { file: "listening-room.png", alt: "Listening room" },
      { file: "bar.png", alt: "Bar area" },
      { file: "lounge.png", alt: "Lounge area" },
    ],
    venue_spaces: [
      { value: "listening_room", label: "Listening Room", price: "Starting at $3,500" },
      { value: "bar_lounge", label: "Bar & Lounge", price: "Starting at $2,500" },
      { value: "full_buyout", label: "Full Venue Buyout", price: "Starting at $8,000" },
      { value: "not_sure", label: "Not Sure Yet", price: "We'll help you decide" },
    ],
    budget_options: [
      { value: "under_3k", label: "Less than $3,000" },
      { value: "3k_5k", label: "$3,000 – $5,000" },
      { value: "5k_8k", label: "$5,000 – $8,000" },
      { value: "8k_plus", label: "$8,000+" },
    ],
    tripleseat: {
      publicKey: process.env.VITE_TRB_TRIPLESEAT_PUBLIC_KEY ?? "",
      leadFormId: numOrUndef(process.env.VITE_TRB_TRIPLESEAT_LEAD_FORM_ID),
      locationId: numOrUndef(process.env.VITE_TRB_TRIPLESEAT_LOCATION_ID),
      apiBaseUrl: "https://api.tripleseat.com/v1",
    },
    referral_source_ids: {
      instagram: 6, tiktok: 11888, facebook: 5, google: 3, friend: 10746, blog: 1, other: 1,
    },
    referral_other_source_id: 1,
    theme: {},
  },
];

function numOrUndef(v) {
  return v ? Number(v) : undefined;
}
