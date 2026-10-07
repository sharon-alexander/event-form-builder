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
    const pad = 4;
    if (thumbRect.left < stripRect.left + pad) {
      strip.scrollBy({
        left: thumbRect.left - stripRect.left - pad,
        behavior: "smooth",
      });
    } else if (thumbRect.right > stripRect.right - pad) {
      strip.scrollBy({
        left: thumbRect.right - stripRect.right + pad,
        behavior: "smooth",
      });
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
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-brand-100 shadow-sm">
        <MediaStage
          key={active.src}
          item={active}
          className="h-full w-full object-cover"
        />
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
              className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium tabular-nums text-white"
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
          className="mt-2 flex shrink-0 gap-2 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
    <div className="flex h-dvh flex-col overflow-hidden px-4 py-3 sm:px-6 sm:py-4">
      <div className="shrink-0 text-center">
        {location.logoUrl && (
          <img
            src={location.logoUrl}
            alt=""
            className="mx-auto mb-2 h-10 w-auto max-w-[10rem] object-contain sm:h-12"
          />
        )}
        <p className="mb-1 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          {location.formTitle}
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl">
          {location.name}
        </h1>
      </div>

      {/* Outside text-center so inline text-align from the editor wins. */}
      <div className="mt-3 flex min-h-0 flex-1 flex-col justify-center">
        {splitLayout && active ? (
          <div className="grid h-full max-h-[34rem] min-h-0 w-full grid-rows-2 gap-3 md:grid-cols-2 md:grid-rows-1 md:gap-8">
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
                className={`${copyClass} ${active ? "mb-3 max-h-[30%] shrink-0" : "flex-1"}`}
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

      <div className="mt-3 shrink-0 text-center">
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
