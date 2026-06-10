import { useState } from "react";
import { assetUrl } from "../config";

interface MediaItem {
  type: "image" | "video";
  /** For images: the image URL. For videos: the video file URL (mp4/webm). */
  src: string;
  /** Optional poster image shown for videos before playback. */
  poster?: string;
  alt: string;
}

const VENUE_NAME = "Pearl Box Townhouse";

const ABOUT_BLURB =
  "A landmark townhouse reimagined for unforgettable gatherings. From intimate dinners in the salon to full-buyout celebrations across all three floors, our team handles every detail — florals, lighting, production and more — so you can simply enjoy the moment.";

const GALLERY_MEDIA: MediaItem[] = [
  { type: "image", src: assetUrl("/gallery/salon.png"), alt: "The salon with red velvet seating" },
  { type: "image", src: assetUrl("/gallery/attic.png"), alt: "The attic lounge with wood paneling" },
  { type: "image", src: assetUrl("/gallery/staircase.png"), alt: "Mirrored staircase" },
  { type: "image", src: assetUrl("/gallery/staircase-detail.png"), alt: "Staircase detail with red lighting" },
];

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = GALLERY_MEDIA[activeIndex];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Private Events
        </p>
        <h1 className="font-display text-4xl font-semibold text-gray-900 sm:text-5xl">
          {VENUE_NAME}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-600">
          {ABOUT_BLURB}
        </p>
      </div>

      {/* Gallery */}
      {active && (
        <div className="mt-10">
          <div className="overflow-hidden rounded-2xl bg-brand-100 shadow-sm">
            {active.type === "image" ? (
              <img
                src={active.src}
                alt={active.alt}
                className="h-72 w-full object-cover sm:h-96"
                loading="lazy"
              />
            ) : (
              <video
                key={active.src}
                src={active.src}
                poster={active.poster}
                controls
                playsInline
                className="h-72 w-full bg-black object-cover sm:h-96"
              />
            )}
          </div>

          {GALLERY_MEDIA.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {GALLERY_MEDIA.map((item, i) => (
                <button
                  key={item.src}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`View ${item.alt}`}
                  className={`relative overflow-hidden rounded-lg transition-all ${
                    i === activeIndex
                      ? "ring-2 ring-brand-600 ring-offset-2"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={item.type === "video" ? (item.poster ?? item.src) : item.src}
                    alt={item.alt}
                    className="h-16 w-full object-cover sm:h-20"
                    loading="lazy"
                  />
                  {item.type === "video" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="mt-10 text-center">
        <button type="button" onClick={onStart} className="efb-btn-primary px-10 py-4 text-base">
          Start building your event
        </button>
        <p className="mt-3 text-xs text-gray-400">Takes about 2 minutes</p>
      </div>
    </div>
  );
}
