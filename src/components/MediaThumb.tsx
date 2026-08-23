import type { MediaItem } from "../locations/types";

type ThumbItem = Pick<MediaItem, "type" | "src" | "poster" | "alt">;

export function mediaThumbSrc(item: ThumbItem): string | undefined {
  if (item.type === "video") return item.poster || undefined;
  return item.src || undefined;
}

export function MediaThumb({
  item,
  className,
  alt,
  loading,
}: {
  item: ThumbItem;
  className?: string;
  alt?: string;
  loading?: "lazy" | "eager";
}) {
  const src = mediaThumbSrc(item);
  const label = alt ?? item.alt;
  if (src) {
    return <img src={src} alt={label} className={className} loading={loading} />;
  }
  return <VideoThumbFallback className={className} alt={label} />;
}

export function VideoThumbFallback({
  className = "",
  alt,
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <span
      role="img"
      aria-label={alt || "Video"}
      className={`flex items-center justify-center bg-white ring-1 ring-inset ring-zinc-200 ${className}`}
    >
      <svg
        className="h-[42%] w-[42%] max-h-10 max-w-10 text-zinc-400"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M8 5.14v13.72a1 1 0 001.5.86l11.02-6.86a1 1 0 000-1.72L9.5 4.28a1 1 0 00-1.5.86z" />
      </svg>
    </span>
  );
}
