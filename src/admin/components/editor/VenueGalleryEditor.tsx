import { useRef, useState } from "react";
import type { MediaItem } from "../../../locations/types";
import { uploadGalleryFile } from "../../api";
import MediaPicker from "./MediaPicker";

interface Props {
  label: string;
  media: MediaItem[];
  libraryMedia: MediaItem[];
  onChange: (next: MediaItem[]) => void;
  orgId: string | null;
  slug: string;
  onError: (msg: string) => void;
}

export default function VenueGalleryEditor({
  label,
  media,
  libraryMedia,
  onChange,
  orgId,
  slug,
  onError,
}: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(media.length > 0);
  const [pickerOpen, setPickerOpen] = useState(false);

  function remove(index: number) {
    onChange(media.filter((_, i) => i !== index));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!orgId) {
      onError("Cannot upload before the form has loaded.");
      return;
    }
    setUploading(true);
    try {
      const uploaded: MediaItem[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadGalleryFile(orgId, slug, file);
        uploaded.push({
          type: file.type.startsWith("video") ? "video" : "image",
          src: url,
          alt: file.name.replace(/\.[^.]+$/, ""),
        });
      }
      onChange([...media, ...uploaded]);
      setExpanded(true);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function addExisting(item: MediaItem) {
    if (media.some((m) => m.src === item.src)) return;
    onChange([...media, item]);
    setExpanded(true);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-medium text-brand-700 hover:text-brand-800"
        >
          {expanded ? "Hide" : "Show"} gallery
          {media.length > 0 && (
            <span className="ml-1 text-gray-400">({media.length})</span>
          )}
        </button>
        <div className="flex gap-2">
          {libraryMedia.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setPickerOpen((v) => !v);
                setExpanded(true);
              }}
              className="efb-btn-secondary px-2 py-1 text-xs"
            >
              {pickerOpen ? "Cancel" : "Choose existing"}
            </button>
          )}
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="efb-btn-secondary px-2 py-1 text-xs"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {pickerOpen && (
        <MediaPicker
          library={libraryMedia}
          selected={media}
          onSelect={addExisting}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {expanded && (
        <div className="mt-3 space-y-2">
          {media.length === 0 ? (
            <p className="text-xs text-gray-400">
              No photos or videos for {label || "this space"} yet.
            </p>
          ) : (
            media.map((item, i) => (
              <div key={`${item.src}-${i}`} className="flex items-center gap-2">
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
                  {item.type === "video" ? (
                    <video src={item.src} className="h-full w-full object-cover" />
                  ) : (
                    <img src={item.src} alt={item.alt} className="h-full w-full object-cover" />
                  )}
                </div>
                <input
                  className="efb-input min-w-0 flex-1 py-1.5 text-xs"
                  placeholder="Alt text"
                  value={item.alt}
                  onChange={(e) =>
                    onChange(media.map((m, idx) => (idx === i ? { ...m, alt: e.target.value } : m)))
                  }
                />
                <button
                  type="button"
                  aria-label="Remove"
                  onClick={() => remove(i)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-red-200 text-red-500 hover:bg-red-50"
                >
                  <TrashIcon />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TrashIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
