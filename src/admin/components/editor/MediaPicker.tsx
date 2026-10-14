import type { MediaItem } from "../../../locations/types";
import { mediaKindLabel } from "../../../media/embeds";
import { MediaThumb } from "../../../components/MediaThumb";
import type { LibraryMedia } from "../../mediaLibraryApi";
import { libraryItemToMedia } from "../../utils/formMediaLibrary";
import LoadMoreSentinel from "./LoadMoreSentinel";

interface Props {
  library: LibraryMedia[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  onRetry: () => void;
  onLoadMore: () => void;
  selected: MediaItem[];
  onSelect: (item: MediaItem) => void;
  onClose: () => void;
}

export default function MediaPicker({
  library,
  loading,
  loadingMore,
  hasMore,
  error,
  onRetry,
  onLoadMore,
  selected,
  onSelect,
  onClose,
}: Props) {
  const selectedSrcs = new Set(selected.map((item) => item.src));
  const available = library.filter((item) => !selectedSrcs.has(item.src));

  return (
    <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-700">Choose from the media library</p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-zinc-400 hover:text-zinc-600"
        >
          Close
        </button>
      </div>

      {error && (
        <div className="mb-2 flex items-center justify-between gap-2 text-xs text-red-600">
          <p>{error}</p>
          <button type="button" onClick={onRetry} className="font-medium hover:underline">
            Retry
          </button>
        </div>
      )}

      {loading && library.length === 0 ? (
        <p className="text-xs text-zinc-400">Loading media…</p>
      ) : available.length === 0 && !hasMore ? (
        <p className="text-xs text-zinc-400">
          {library.length === 0
            ? "Upload media on the Media tab, or upload into this gallery."
            : "All available media is already in this gallery."}
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {available.map((item) => {
            const kind = mediaKindLabel(item);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(libraryItemToMedia(item))}
                aria-label={`Add ${item.alt || kind || "media"}`}
                className="group relative overflow-hidden rounded-md ring-1 ring-zinc-200 transition-all hover:ring-zinc-400"
              >
                <MediaThumb
                  item={item}
                  preferThumb
                  className="h-14 w-full object-cover sm:h-16"
                />
                {kind && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {item.alt}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {hasMore && (
        <LoadMoreSentinel disabled={loading || loadingMore} onVisible={onLoadMore} />
      )}
      {loadingMore && <p className="mt-2 text-xs text-zinc-400">Loading more…</p>}
    </div>
  );
}
