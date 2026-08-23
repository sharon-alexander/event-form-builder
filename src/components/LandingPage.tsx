import { useState } from "react";
import { useLocationConfig } from "../context/LocationContext";
import type { MediaItem } from "../locations/types";

const SPLIT_BLURB_CHARS = 300;

interface LandingPageProps {
  onStart: () => void;
}

function Gallery({
  active,
  items,
  activeIndex,
  onSelect,
}: {
  active: MediaItem;
  items: MediaItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div>
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

      {items.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {items.map((item, i) => (
            <button
              key={item.src}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`View ${item.alt}`}
              className={`relative overflow-hidden rounded-lg transition-all ${
                i === activeIndex
                  ? "ring-2 ring-brand-600 ring-offset-2"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={
                  item.type === "video" ? (item.poster ?? item.src) : item.src
                }
                alt={item.alt}
                className="h-16 w-full object-cover sm:h-20"
                loading="lazy"
              />
              {item.type === "video" && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const location = useLocationConfig();
  const [activeIndex, setActiveIndex] = useState(0);
  const active = location.galleryMedia[activeIndex];
  const splitLayout =
    location.aboutBlurb.length > SPLIT_BLURB_CHARS && Boolean(active);

  return (
    <div className="px-4 py-10 sm:px-6">
      <div className="text-center">
        {location.logoUrl && (
          <img
            src={location.logoUrl}
            alt=""
            className="mx-auto mb-4 h-16 w-auto max-w-[12rem] object-contain sm:h-20"
          />
        )}
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          {location.formTitle}
        </p>
        <h1 className="font-display text-4xl font-semibold text-gray-900 sm:text-5xl">
          {location.name}
        </h1>
        {!splitLayout && (
          <p className="mt-4 text-base leading-relaxed text-gray-600">
            {location.aboutBlurb}
          </p>
        )}
      </div>

      {splitLayout && active ? (
        <div className="mt-10 grid items-start gap-8 md:grid-cols-2">
          <Gallery
            active={active}
            items={location.galleryMedia}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
          />
          <p className="text-base leading-relaxed text-gray-600 md:pt-1">
            {location.aboutBlurb}
          </p>
        </div>
      ) : (
        active && (
          <div className="mt-10">
            <Gallery
              active={active}
              items={location.galleryMedia}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
            />
          </div>
        )
      )}

      {/* CTA */}
      <div className="mt-10 text-center">
        <button
          type="button"
          onClick={onStart}
          className="efb-btn-primary px-10 py-4 text-base"
        >
          Start building your event
        </button>
        <p className="mt-3 text-xs text-gray-400">Takes about 2 minutes</p>
      </div>
    </div>
  );
}
