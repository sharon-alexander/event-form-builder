import { useEffect, useId, useRef, useState } from "react";
import { useLocationConfig } from "../context/LocationContext";
import type { GalleryAlbum, MediaItem } from "../locations/types";
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
  albums,
  albumIndex,
  onSelectAlbum,
}: {
  active: MediaItem;
  items: MediaItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
  albums: GalleryAlbum[];
  albumIndex: number;
  onSelectAlbum: (index: number) => void;
}) {
  const galleryId = useId();
  const stripRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const multiple = items.length > 1;
  const showAlbums = albums.length > 1;
  const albumTitle = albums[albumIndex]?.title.trim() ?? "";

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
      target.closest("video, iframe, [role='tablist']")
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

  function onAlbumKeyDown(e: React.KeyboardEvent) {
    if (!showAlbums) return;
    let next = albumIndex;
    if (e.key === "ArrowRight") next = (albumIndex + 1) % albums.length;
    else if (e.key === "ArrowLeft") next = (albumIndex - 1 + albums.length) % albums.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = albums.length - 1;
    else return;
    e.preventDefault();
    e.stopPropagation();
    onSelectAlbum(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div
      id={galleryId}
      role="region"
      aria-roledescription="carousel"
      aria-label={albumTitle ? `${albumTitle} gallery` : "Gallery"}
      tabIndex={multiple ? 0 : undefined}
      onKeyDown={onKeyDown}
      className="flex h-full min-h-0 w-full min-w-0 flex-col rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
    >
      <div className="relative min-h-[14rem] w-full flex-1 overflow-hidden rounded-2xl bg-brand-100 shadow-sm md:min-h-0">
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
          {albumTitle ? `${albumTitle}. ` : ""}
          {activeIndex + 1} of {items.length}
        </div>
      )}

      {showAlbums && (
        <div
          role="tablist"
          aria-label="Photo folders"
          onKeyDown={onAlbumKeyDown}
          className="mt-3 flex w-full min-w-0 shrink-0 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {albums.map((entry, i) => {
            const cover = entry.media[0];
            if (!cover) return null;
            const selected = i === albumIndex;
            const title = entry.title.trim() || "Untitled folder";
            return (
              <button
                key={entry.id}
                ref={(node) => {
                  tabRefs.current[i] = node;
                }}
                id={`${galleryId}-album-${entry.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={galleryId}
                tabIndex={selected ? 0 : -1}
                onClick={() => onSelectAlbum(i)}
                className={`flex max-w-[11rem] shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                  selected
                    ? "border-brand-600 bg-brand-50 text-gray-900"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <span aria-hidden className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
                  <MediaThumb item={cover} alt="" className="h-full w-full object-cover" />
                </span>
                <span className="truncate font-medium">{title}</span>
              </button>
            );
          })}
        </div>
      )}

      {multiple && (
        <div
          ref={stripRef}
          className="mt-3 hidden w-full min-w-0 shrink-0 gap-2 overflow-x-auto p-2 [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden"
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
  const visibleAlbums = location.galleryAlbums.filter((album) => album.media.length > 0);
  const [albumIndex, setAlbumIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const albumIndexSafe =
    visibleAlbums.length === 0 ? 0 : Math.min(albumIndex, visibleAlbums.length - 1);
  const album = visibleAlbums[albumIndexSafe];
  const items = album?.media ?? [];
  const activeIndexSafe = items.length === 0 ? 0 : Math.min(activeIndex, items.length - 1);
  const active = items[activeIndexSafe];
  const aboutHtml = toDisplayHtml(location.aboutBlurb);
  const splitLayout =
    visibleBlurbLength(aboutHtml) > SPLIT_BLURB_CHARS && Boolean(active);

  function selectAlbum(index: number) {
    setAlbumIndex(index);
    setActiveIndex(0);
  }

  const copyClass =
    "efb-rich-text efb-landing-copy min-h-0 min-w-0 overflow-y-auto text-left text-sm leading-relaxed text-gray-600";

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
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
        {splitLayout && active ? (
          <div className="grid h-full min-h-0 min-w-0 grid-rows-[minmax(14rem,1.35fr)_minmax(0,1fr)] gap-8 md:grid-cols-2 md:grid-rows-1 md:gap-10">
            <Gallery
              active={active}
              items={items}
              activeIndex={activeIndexSafe}
              onSelect={setActiveIndex}
              albums={visibleAlbums}
              albumIndex={albumIndexSafe}
              onSelectAlbum={selectAlbum}
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
              <div className="min-h-0 min-w-0 flex-1">
                <Gallery
                  active={active}
                  items={items}
                  activeIndex={activeIndexSafe}
                  onSelect={setActiveIndex}
                  albums={visibleAlbums}
                  albumIndex={albumIndexSafe}
                  onSelectAlbum={selectAlbum}
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
