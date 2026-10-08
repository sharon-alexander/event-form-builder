import { useEffect, useRef, useState } from "react";
import { useLocationConfig } from "../context/LocationContext";
import type { MediaItem } from "../locations/types";
import { mediaKindLabel } from "../media/embeds";
import { toDisplayHtml } from "../utils/richText";
import MediaStage from "./MediaStage";
import { MediaThumb } from "./MediaThumb";

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
  const stripRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const multiple = items.length > 1;

  useEffect(() => {
    if (!multiple) return;
    const strip = stripRef.current;
    const thumb = thumbRefs.current[activeIndex];
    if (!strip || !thumb) return;
    const stripRect = strip.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const pad = 8;
    if (thumbRect.left < stripRect.left + pad) {
      strip.scrollLeft += thumbRect.left - stripRect.left - pad;
    } else if (thumbRect.right > stripRect.right - pad) {
      strip.scrollLeft += thumbRect.right - stripRect.right + pad;
    }
  }, [activeIndex, multiple]);

  function step(delta: number) {
    onSelect((activeIndex + delta + items.length) % items.length);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!multiple) return;
    const target = e.target;
    if (
      target instanceof HTMLElement &&
      target.closest("video, iframe")
    ) {
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    }
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Gallery"
      tabIndex={multiple ? 0 : undefined}
      onKeyDown={onKeyDown}
      className="flex h-full min-h-0 flex-col rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
    >
      <div className="relative min-h-40 flex-1 overflow-hidden rounded-2xl bg-brand-100 shadow-sm">
        <div className="absolute inset-0">
          <MediaStage
            key={active.src}
            item={active}
            className="h-full w-full object-cover"
          />
        </div>
        {multiple && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => step(-1)}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md ring-1 ring-black/5 transition-colors hover:bg-white"
            >
              <Chevron direction="left" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => step(1)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md ring-1 ring-black/5 transition-colors hover:bg-white"
            >
              <Chevron direction="right" />
            </button>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium tabular-nums text-white"
            >
              {activeIndex + 1} / {items.length}
            </span>
          </>
        )}
      </div>

      {multiple && (
        <div className="sr-only" aria-live="polite">
          {activeIndex + 1} of {items.length}
        </div>
      )}

      {multiple && (
        <div
          ref={stripRef}
          className="mt-3 flex shrink-0 gap-2 overflow-x-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, i) => {
            const kind = mediaKindLabel(item);
            return (
              <button
                key={item.src}
                ref={(node) => {
                  thumbRefs.current[i] = node;
                }}
                type="button"
                onClick={() => onSelect(i)}
                aria-label={`View ${item.alt || kind || "media"}`}
                aria-current={i === activeIndex ? "true" : undefined}
                className={`relative w-[calc((100%-3rem)/4.35)] shrink-0 overflow-hidden rounded-lg transition-all ${
                  i === activeIndex
                    ? "ring-2 ring-brand-600 ring-offset-2"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <MediaThumb
                  item={item}
                  className="h-14 w-full object-cover sm:h-16"
                  loading="lazy"
                />
                {kind && (
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
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      {direction === "left" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      )}
    </svg>
  );
}

function visibleBlurbLength(html: string): number {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim().length;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const location = useLocationConfig();
  const [activeIndex, setActiveIndex] = useState(0);
  const active = location.galleryMedia[activeIndex];
  const aboutHtml = toDisplayHtml(location.aboutBlurb);
  const splitLayout =
    visibleBlurbLength(aboutHtml) > SPLIT_BLURB_CHARS && Boolean(active);

  const copyClass =
    "efb-rich-text efb-landing-copy min-h-0 overflow-y-auto text-left text-sm leading-relaxed text-gray-600";

  return (
    <div className="flex h-full min-h-0 flex-col gap-8 overflow-hidden px-4 py-6 sm:gap-10 sm:px-6 sm:py-8">
      <div
        className={`flex shrink-0 items-center justify-center gap-3 sm:gap-4 ${
          location.logoUrl ? "" : "text-center"
        }`}
      >
        {location.logoUrl && (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-brand-200 bg-white p-1.5 sm:h-16 sm:w-16">
            <img
              src={location.logoUrl}
              alt=""
              className="h-full w-full object-contain"
            />
          </div>
        )}
        <div className={location.logoUrl ? "min-w-0 text-left" : ""}>
          <p className="mb-0.5 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            {location.formTitle}
          </p>
          <h1 className="font-display text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl">
            {location.name}
          </h1>
        </div>
      </div>

      {/* Outside text-center so inline text-align from the editor wins. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {splitLayout && active ? (
          <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-8 md:grid-cols-2 md:grid-rows-1 md:gap-10">
            <Gallery
              active={active}
              items={location.galleryMedia}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
            />
            <div
              className={`${copyClass} h-full pr-2`}
              dangerouslySetInnerHTML={{ __html: aboutHtml }}
            />
          </div>
        ) : (
          <>
            {aboutHtml ? (
              <div
                className={`${copyClass} ${active ? "mb-8 max-h-[30%] shrink-0" : "min-h-0 flex-1"}`}
                dangerouslySetInnerHTML={{ __html: aboutHtml }}
              />
            ) : null}
            {active ? (
              <div className="min-h-0 flex-1">
                <Gallery
                  active={active}
                  items={location.galleryMedia}
                  activeIndex={activeIndex}
                  onSelect={setActiveIndex}
                />
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="shrink-0 text-center">
        <button
          type="button"
          onClick={onStart}
          className="efb-btn-primary px-10"
        >
          Start building your event
        </button>
        <p className="mt-1.5 text-xs text-gray-400">Takes about 2 minutes</p>
      </div>
    </div>
  );
}
