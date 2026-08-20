import { type DragEvent, useRef, useState } from "react";
import type { MediaItem } from "../../../locations/types";
import { uploadGalleryFile } from "../../api";
import MediaPicker from "./MediaPicker";

interface Props {
  media: MediaItem[];
  libraryMedia: MediaItem[];
  onChange: (next: MediaItem[]) => void;
  orgId: string | null;
  slug: string;
  onError: (msg: string) => void;
}

export default function VenueGalleryEditor({
  media,
  libraryMedia,
  onChange,
  orgId,
  slug,
  onError,
}: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-zinc-700">Photos</p>
        <div className="flex flex-wrap gap-2">
          {libraryMedia.length > 0 && (
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="adm-btn-secondary px-2 py-1 text-xs"
            >
              {pickerOpen ? "Cancel" : "Choose existing"}
            </button>
          )}
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="adm-btn-secondary px-2 py-1 text-xs"
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
        <div className="mt-3">
          <MediaPicker
            library={libraryMedia}
            selected={media}
            onSelect={addExisting}
            onClose={() => setPickerOpen(false)}
          />
        </div>
      )}

      {media.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          className={`mt-3 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors ${
            dragOver ? "border-zinc-400 bg-zinc-100" : "border-zinc-200"
          }`}
        >
          <p className="text-xs text-zinc-400">{uploading ? "Uploading…" : "Drop or upload"}</p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {media.map((item, i) => (
            <div key={`${item.src}-${i}`} className="flex items-center gap-2">
              <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                {item.type === "video" ? (
                  <video src={item.src} className="h-full w-full object-cover" />
                ) : (
                  <img src={item.src} alt={item.alt} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                {i === 0 && (
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                    Card preview
                  </p>
                )}
                <input
                  className="adm-input min-w-0 w-full py-1.5 text-xs"
                  placeholder="Alt text"
                  value={item.alt}
                  onChange={(e) =>
                    onChange(media.map((m, idx) => (idx === i ? { ...m, alt: e.target.value } : m)))
                  }
                />
              </div>
              <button
                type="button"
                aria-label="Remove"
                onClick={() => remove(i)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-red-200 text-red-500 hover:bg-red-50"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
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
