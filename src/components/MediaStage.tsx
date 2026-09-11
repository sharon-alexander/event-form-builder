import type { MediaItem } from "../locations/types";
import { useStaticPreview } from "../context/StaticPreviewContext";
import { embedHostAllowed, providerForItem } from "../media/embeds";
import { MediaThumb } from "./MediaThumb";

export default function MediaStage({
  item,
  className = "",
}: {
  item: MediaItem;
  className?: string;
}) {
  const staticPreview = useStaticPreview();

  if (item.type === "image") {
    return (
      <img
        src={item.src}
        alt={item.alt}
        className={className}
        loading={staticPreview ? "eager" : "lazy"}
      />
    );
  }

  if (item.type === "embed") {
    const provider = providerForItem(item);
    if (!provider || !embedHostAllowed(item.src) || staticPreview) {
      return <EmbedPoster item={item} alt={item.alt || provider?.label || "Video"} />;
    }
    return (
      <div className="relative aspect-video w-full bg-black">
        <iframe
          key={item.src}
          title={item.alt || provider.label}
          src={item.src}
          className="absolute inset-0 h-full w-full border-0"
          allow={provider.iframeAllow}
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <video
      key={item.src}
      src={item.src}
      poster={item.poster}
      controls
      playsInline
      className={`bg-black ${className}`}
    />
  );
}

function EmbedPoster({ item, alt }: { item: MediaItem; alt: string }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      <MediaThumb
        item={item}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
      />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
        <svg
          className="h-12 w-12 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </div>
  );
}
