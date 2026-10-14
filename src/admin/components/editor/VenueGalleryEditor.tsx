import { type DragEvent, useEffect, useRef, useState } from "react";
import type { MediaItem } from "../../../locations/types";
import { mediaKindLabel } from "../../../media/embeds";
import { insertLocationMedia, savedFromUploadError, uploadToLibrary, type LibraryMedia } from "../../mediaLibraryApi";
import type { FormMediaLibrary } from "../../useFormMediaLibrary";
import { appendUnique, libraryItemToMedia } from "../../utils/formMediaLibrary";
import { MediaThumb } from "../../../components/MediaThumb";
import EmbedPasteField from "./EmbedPasteField";
import MediaPicker from "./MediaPicker";

export type MediaListUpdate = MediaItem[] | ((current: MediaItem[]) => MediaItem[]);

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  media: MediaItem[];
  library: FormMediaLibrary;
  onChange: (next: MediaListUpdate) => void;
  orgId: string | null;
  locationId: string | null;
  slug: string;
  onError: (msg: string) => void;
}

export default function VenueGalleryEditor({
  open,
  onClose,
  title,
  media,
  library,
  onChange,
  orgId,
  locationId,
  slug,
  onError,
}: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!open) {
      setPickerOpen(false);
      setEmbedOpen(false);
      setDragOver(false);
      return;
    }
    if (pickerOpen) void library.ensureLoaded();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, pickerOpen, library.ensureLoaded]);

  if (!open) return null;

  function remove(index: number) {
    onChange((current) => current.filter((_, i) => i !== index));
  }

  function setAsThumbnail(index: number) {
    onChange((current) => {
      if (index <= 0 || index >= current.length) return current;
      const item = current[index];
      if (!item) return current;
      const next = [...current];
      next.splice(index, 1);
      next.unshift(item);
      return next;
    });
  }

  function addUploaded(saved: LibraryMedia[]) {
    if (saved.length === 0) return;
    library.remember(saved);
    onChange((current) => appendUnique(current, saved.map(libraryItemToMedia)));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!orgId || !locationId) {
      onError("Cannot upload before the form has loaded.");
      return;
    }
    setUploading(true);
    try {
      addUploaded(await uploadToLibrary(orgId, slug, locationId, Array.from(files)));
    } catch (err) {
      addUploaded(savedFromUploadError(err));
      onError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function addExisting(item: MediaItem) {
    onChange((current) => appendUnique(current, [item]));
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
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="adm-btn-secondary px-3 py-1.5 text-xs"
            >
              {pickerOpen ? "Cancel" : "Choose existing"}
            </button>
            <button
              type="button"
              onClick={() => setEmbedOpen((v) => !v)}
              className="adm-btn-secondary px-3 py-1.5 text-xs"
            >
              {embedOpen ? "Cancel" : "Add embed"}
            </button>
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

          {embedOpen && (
            <div className="mb-4">
              <EmbedPasteField
                existingSrcs={media.map((m) => m.src)}
                onAdd={async (item) => {
                  if (!locationId) throw new Error("Cannot upload before the form has loaded.");
                  const saved = await insertLocationMedia(locationId, item);
                  library.remember([saved]);
                  addExisting(libraryItemToMedia(saved));
                  setEmbedOpen(false);
                }}
                onError={onError}
              />
            </div>
          )}

          {pickerOpen && (
            <div className="mb-4">
              <MediaPicker
                library={library.items}
                loading={library.loading}
                loadingMore={library.loadingMore}
                hasMore={library.hasMore}
                error={library.error}
                onRetry={() => void library.reload()}
                onLoadMore={() => void library.loadMore()}
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
                    : "Drop images or videos here, click Upload, or add an embed."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {media.map((item, i) => {
                  const isThumb = i === 0;
                  const kind = mediaKindLabel(item);
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
                            ? `${item.alt || kind || "Photo"} (card thumbnail)`
                            : `Set ${item.alt || "photo"} as card thumbnail`
                        }
                        aria-current={isThumb ? "true" : undefined}
                        className="absolute inset-0"
                      >
                        <MediaThumb
                          item={item}
                          preferThumb
                          className="h-full w-full object-cover"
                        />
                        {kind && (
                          <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white">
                            {kind}
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
                onChange={(e) => {
                  const alt = e.target.value;
                  onChange((current) => current.map((m, idx) => (idx === 0 ? { ...m, alt } : m)));
                }}
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
