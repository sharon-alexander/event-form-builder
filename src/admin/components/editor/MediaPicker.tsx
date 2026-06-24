import type { MediaItem } from "../../../locations/types";

interface Props {
  library: MediaItem[];
  selected: MediaItem[];
  onSelect: (item: MediaItem) => void;
  onClose: () => void;
}

export default function MediaPicker({ library, selected, onSelect, onClose }: Props) {
  const selectedSrcs = new Set(selected.map((m) => m.src));
  const available = library.filter((m) => !selectedSrcs.has(m.src));

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-gray-700">Choose from existing media</p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Close
        </button>
      </div>

      {available.length === 0 ? (
        <p className="text-xs text-gray-400">
          {library.length === 0
            ? "Upload media on the Gallery tab or to another venue first."
            : "All available media is already in this gallery."}
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {available.map((item) => (
            <button
              key={item.src}
              type="button"
              onClick={() => onSelect(item)}
              aria-label={`Add ${item.alt}`}
              className="group relative overflow-hidden rounded-md ring-1 ring-slate-200 transition-all hover:ring-brand-500"
            >
              <img
                src={item.type === "video" ? (item.poster ?? item.src) : item.src}
                alt={item.alt}
                className="h-14 w-full object-cover sm:h-16"
              />
              {item.type === "video" && (
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
          ))}
        </div>
      )}
    </div>
  );
}
