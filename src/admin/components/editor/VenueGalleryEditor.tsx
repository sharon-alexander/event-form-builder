import { type DragEvent, useEffect, useRef, useState } from "react";
import type { MediaItem } from "../../../locations/types";
import { uploadGalleryFile } from "../../api";
import { VideoThumbFallback } from "../../../components/MediaThumb";
import MediaPicker from "./MediaPicker";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  media: MediaItem[];
  libraryMedia: MediaItem[];
  onChange: (next: MediaItem[]) => void;
  orgId: string | null;
  slug: string;
  onError: (msg: string) => void;
}

export default function VenueGalleryEditor({
  open,
  onClose,
  title,
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

  useEffect(() => {
    if (!open) {
      setPickerOpen(false);
      setDragOver(false);
      return;
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function remove(index: number) {
    onChange(media.filter((_, i) => i !== index));
  }

  function setAsThumbnail(index: number) {
    if (index <= 0 || index >= media.length) return;
    const item = media[index];
    if (!item) return;
    const next = [...media];
    next.splice(index, 1);
    next.unshift(item);
    onChange(next);
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

  const thumbnail = media[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} photos`}
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-zinc-900">
              {title.trim() || "Untitled space"}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Click a photo or video to set the card thumbnail.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            {libraryMedia.length > 0 && (
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                className="adm-btn-secondary px-3 py-1.5 text-xs"
              >
                {pickerOpen ? "Cancel" : "Choose existing"}
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="adm-btn-primary px-3 py-1.5 text-xs"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
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
            <div className="mb-4">
              <MediaPicker
                library={libraryMedia}
                selected={media}
                onSelect={addExisting}
                onClose={() => setPickerOpen(false)}
              />
            </div>
          )}

          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            className={`rounded-xl border-2 border-dashed p-3 transition-colors ${
              dragOver
                ? "border-zinc-400 bg-zinc-50"
                : media.length === 0
                  ? "border-zinc-300"
                  : "border-transparent p-0"
            }`}
          >
            {media.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-zinc-400">
                  {uploading
                    ? "Uploading…"
                    : "Drop images or videos here, or click Upload."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {media.map((item, i) => {
                  const src = item.type === "video" ? (item.poster ?? item.src) : item.src;
                  const isThumb = i === 0;
                  return (
                    <div
                      key={`${item.src}-${i}`}
                      className={`group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 ring-offset-2 ${
                        isThumb ? "ring-2 ring-zinc-900" : "hover:ring-2 hover:ring-zinc-300"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setAsThumbnail(i)}
                        aria-label={
                          isThumb
                            ? `${item.alt || "Photo"} (card thumbnail)`
                            : `Set ${item.alt || "photo"} as card thumbnail`
                        }
                        aria-current={isThumb ? "true" : undefined}
                        className="absolute inset-0"
                      >
                        {item.type === "video" && !item.poster ? (
                          <VideoThumbFallback className="h-full w-full" alt={item.alt} />
                        ) : (
                          <img src={src} alt={item.alt} className="h-full w-full object-cover" />
                        )}
                        {item.type === "video" && (
                          <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white">
                            Video
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        aria-label="Remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(i);
                        }}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {thumbnail && (
            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Alt text (thumbnail)
              </label>
              <input
                className="adm-input w-full py-2 text-sm"
                placeholder="Describe this photo..."
                value={thumbnail.alt}
                onChange={(e) =>
                  onChange(media.map((m, idx) => (idx === 0 ? { ...m, alt: e.target.value } : m)))
                }
              />
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
