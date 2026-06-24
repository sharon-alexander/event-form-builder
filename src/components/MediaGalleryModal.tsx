import { useEffect, useState } from "react";
import type { MediaItem } from "../locations/types";

interface Props {
  title: string;
  media: MediaItem[];
  open: boolean;
  onClose: () => void;
}

export default function MediaGalleryModal({ title, media, open, onClose }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = media[activeIndex];

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !active) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} gallery`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close gallery"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-slate-100 hover:text-gray-700"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-5">
          <div className="overflow-hidden rounded-xl bg-brand-100">
            {active.type === "image" ? (
              <img
                src={active.src}
                alt={active.alt}
                className="max-h-[60vh] w-full object-cover"
              />
            ) : (
              <video
                key={active.src}
                src={active.src}
                poster={active.poster}
                controls
                playsInline
                className="max-h-[60vh] w-full bg-black object-cover"
              />
            )}
          </div>

          {media.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {media.map((item, i) => (
                <button
                  key={`${item.src}-${i}`}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`View ${item.alt}`}
                  aria-current={i === activeIndex ? "true" : undefined}
                  className={`relative overflow-hidden rounded-lg transition-all ${
                    i === activeIndex
                      ? "ring-2 ring-brand-600 ring-offset-2"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={item.type === "video" ? (item.poster ?? item.src) : item.src}
                    alt={item.alt}
                    className="h-14 w-full object-cover sm:h-16"
                    loading="lazy"
                  />
                  {item.type === "video" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
