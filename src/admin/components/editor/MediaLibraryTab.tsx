import { type DragEvent, useEffect, useRef, useState } from "react";
import type { EditableLocation } from "../../pages/FormEditorPage";
import {
  deleteLocationMedia,
  insertLocationMedia,
  savedFromUploadError,
  uploadToLibrary,
} from "../../mediaLibraryApi";
import { deleteGalleryFiles } from "../../api";
import type { FormMediaLibrary } from "../../useFormMediaLibrary";
import { placementUsages } from "../../utils/formMediaLibrary";
import { mediaKindLabel } from "../../../media/embeds";
import { MediaThumb } from "../../../components/MediaThumb";
import EmbedPasteField from "./EmbedPasteField";
import LoadMoreSentinel from "./LoadMoreSentinel";

interface Props {
  locationId: string;
  draft: EditableLocation;
  saved: Pick<EditableLocation, "gallery_media" | "venue_spaces">;
  orgId: string | null;
  library: FormMediaLibrary;
  onError: (msg: string) => void;
}

export default function MediaLibraryTab({ locationId, draft, saved, orgId, library, onError }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void library.ensureLoaded();
  }, [library.ensureLoaded]);

  const selectedItems = library.items.filter((item) => selected.has(item.id));
  const usagesFor = (src: string) => placementUsages([draft, saved], src);
  const unusedSelected = selectedItems.filter((item) => usagesFor(item.src).length === 0);
  const loadedIds = library.items.map((item) => item.id);
  const allLoadedSelected = loadedIds.length > 0 && loadedIds.every((id) => selected.has(id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllLoaded() {
    setSelected((prev) => {
      if (allLoadedSelected) {
        const next = new Set(prev);
        for (const id of loadedIds) next.delete(id);
        return next;
      }
      return new Set([...prev, ...loadedIds]);
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!orgId) {
      onError("Cannot upload before the form has loaded.");
      return;
    }
    setUploading(true);
    setNotice(null);
    try {
      const saved = await uploadToLibrary(orgId, draft.slug, locationId, Array.from(files));
      library.remember(saved);
    } catch (err) {
      const saved = savedFromUploadError(err);
      if (saved.length > 0) library.remember(saved);
      onError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function removeSelected() {
    if (unusedSelected.length === 0 || deleting) return;
    const kept = selectedItems.length - unusedSelected.length;
    setDeleting(true);
    setNotice(null);
    let removed = false;
    try {
      await deleteLocationMedia(unusedSelected.map((item) => item.id));
      removed = true;
      try {
        await deleteGalleryFiles(unusedSelected.flatMap((item) => [item.src, item.thumb]));
      } catch (err) {
        onError(err instanceof Error ? err.message : "Could not delete media files.");
      }
      try {
        await library.reload();
      } catch (err) {
        onError(err instanceof Error ? err.message : "Could not refresh media.");
      }
      setSelected(new Set());
      setNotice(
        kept > 0
          ? `${kept} still shown on the landing page or a venue ${kept === 1 ? "was" : "were"} kept.`
          : null,
      );
    } catch (err) {
      if (!removed) onError(err instanceof Error ? err.message : "Could not delete media.");
    } finally {
      setDeleting(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) void handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Media library</h2>
          <p className="mt-0.5 max-w-xl text-xs text-zinc-400">
            Upload photos and videos for this form. Add them to the landing page or a venue from
            those sections. Removing one there only hides it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {library.items.length > 0 && (
            <button type="button" onClick={toggleAllLoaded} className="adm-btn-secondary px-3 py-1.5 text-xs">
              {allLoadedSelected ? "Clear selection" : "Select loaded"}
            </button>
          )}
          <button
            type="button"
            onClick={() => void removeSelected()}
            disabled={unusedSelected.length === 0 || deleting}
            title={
              selectedItems.length > 0 && unusedSelected.length === 0
                ? "Remove it from the landing page or venue first"
                : undefined
            }
            className="adm-btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
          >
            {deleting ? "Deleting…" : unusedSelected.length > 0 ? `Delete (${unusedSelected.length})` : "Delete"}
          </button>
          <button
            type="button"
            onClick={() => setEmbedOpen((open) => !open)}
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
            onChange={(e) => void handleFiles(e.target.files)}
          />
        </div>
      </div>

      {notice && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {notice}
        </p>
      )}

      {embedOpen && (
        <EmbedPasteField
          existingSrcs={library.items.map((item) => item.src)}
          onAdd={async (item) => {
            const savedItem = await insertLocationMedia(locationId, item);
            library.remember([savedItem]);
            setEmbedOpen(false);
          }}
          onError={onError}
        />
      )}

      {library.error && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <p>{library.error}</p>
          <button type="button" onClick={() => void library.reload()} className="font-medium hover:underline">
            Retry
          </button>
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
          dragOver ? "border-blue-400 bg-blue-50" : "border-zinc-200"
        }`}
      >
        {library.loading && library.items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-zinc-400">Loading media…</p>
        ) : library.items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-zinc-400">
            {uploading ? "Uploading…" : "Drop images or videos here, or click Upload."}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {library.items.map((item) => {
              const usages = usagesFor(item.src);
              const kind = mediaKindLabel(item);
              const isSelected = selected.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-pressed={isSelected}
                  aria-label={`${isSelected ? "Deselect" : "Select"} ${item.alt || kind || "media"}`}
                  className={`group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 text-left ring-offset-2 ${
                    isSelected ? "ring-2 ring-blue-500" : "hover:ring-2 hover:ring-zinc-300"
                  }`}
                >
                  <MediaThumb item={item} preferThumb className="h-full w-full object-cover" />
                  <span
                    className={`absolute left-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded border text-white ${
                      isSelected ? "border-blue-500 bg-blue-500" : "border-white/80 bg-black/30"
                    }`}
                    aria-hidden
                  >
                    {isSelected && (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {(usages.length > 0 || kind) && (
                    <span
                      title={usages.length > 0 ? usages.join(", ") : undefined}
                      className="absolute inset-x-1 bottom-1 truncate rounded bg-black/60 px-1 py-0.5 text-[9px] font-medium text-white"
                    >
                      {usages.length > 0 ? usages.join(" · ") : kind}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {library.hasMore && (
          <LoadMoreSentinel
            disabled={library.loading || library.loadingMore || !!library.error}
            onVisible={() => void library.loadMore()}
          />
        )}
        {library.loadingMore && (
          <p className="mt-2 text-center text-xs text-zinc-400">Loading more…</p>
        )}
      </div>
    </div>
  );
}
