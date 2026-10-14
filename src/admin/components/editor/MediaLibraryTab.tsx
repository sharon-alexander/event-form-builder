import { type DragEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { EditableLocation } from "../../pages/FormEditorPage";
import {
  deleteLocationMedia,
  insertLocationMedia,
  savedFromUploadError,
  updateLocationMediaAlt,
  uploadToLibrary,
  type LibraryMedia,
} from "../../mediaLibraryApi";
import { deleteGalleryFiles } from "../../api";
import type { FormMediaLibrary } from "../../useFormMediaLibrary";
import { placementUsages } from "../../utils/formMediaLibrary";
import { mediaKindLabel } from "../../../media/embeds";
import { MediaThumb } from "../../../components/MediaThumb";
import EmbedPasteField from "./EmbedPasteField";
import LoadMoreSentinel from "./LoadMoreSentinel";

/** Upload stores the file name, without its extension, as alt text. */
function mediaFileName(item: { alt: string; src: string }): string {
  const alt = item.alt.trim();
  if (alt) return alt;
  const base = item.src.split("?")[0]?.split("/").pop() ?? "";
  let name = base;
  try {
    name = decodeURIComponent(base);
  } catch {
    name = base;
  }
  name = name.replace(/^\d+-/, "").replace(/\.[^.]+$/, "");
  return name || "Untitled";
}

function fileExtension(src: string): string | null {
  const base = src.split("?")[0]?.split("/").pop() ?? "";
  const match = /\.([a-z0-9]+)$/i.exec(base);
  return match?.[1]?.toUpperCase() ?? null;
}

function mediaTypeLabel(item: LibraryMedia): string {
  const kind =
    item.type === "video" ? "Video" : item.type === "embed" ? (mediaKindLabel(item) ?? "Embed") : "Image";
  const ext = item.type === "embed" ? null : fileExtension(item.src);
  return ext ? `${kind} (${ext})` : kind;
}

interface Props {
  locationId: string;
  draft: EditableLocation;
  saved: Pick<EditableLocation, "gallery_media" | "venue_spaces">;
  orgId: string | null;
  library: FormMediaLibrary;
  onError: (msg: string) => void;
}

export default function MediaLibraryTab({
  locationId,
  draft,
  saved,
  orgId,
  library,
  onError,
}: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    void library.ensureLoaded();
  }, [library.ensureLoaded]);

  const selectedItems = library.items.filter((item) => selected.has(item.id));
  const usagesFor = (src: string) => placementUsages([draft, saved], src);
  const unusedSelected = selectedItems.filter(
    (item) => usagesFor(item.src).length === 0,
  );
  const loadedIds = library.items.map((item) => item.id);
  const allLoadedSelected =
    loadedIds.length > 0 && loadedIds.every((id) => selected.has(id));

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
      const saved = await uploadToLibrary(
        orgId,
        draft.slug,
        locationId,
        Array.from(files),
      );
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
        await deleteGalleryFiles(
          unusedSelected.flatMap((item) => [item.src, item.thumb]),
        );
      } catch (err) {
        onError(
          err instanceof Error ? err.message : "Could not delete media files.",
        );
      }
      try {
        await library.reload();
      } catch (err) {
        onError(
          err instanceof Error ? err.message : "Could not refresh media.",
        );
      }
      setSelected(new Set());
      setNotice(
        kept > 0
          ? `${kept} still shown on the landing page or a venue ${kept === 1 ? "was" : "were"} kept.`
          : null,
      );
    } catch (err) {
      if (!removed)
        onError(err instanceof Error ? err.message : "Could not delete media.");
    } finally {
      setDeleting(false);
    }
  }

  const detailsItem = library.items.find((item) => item.id === detailsId) ?? null;
  const renameItem = library.items.find((item) => item.id === renameId) ?? null;

  async function saveRename() {
    if (!renameItem || renaming) return;
    const next = renameValue.trim();
    if (!next) return;
    if (next === mediaFileName(renameItem)) {
      setRenameId(null);
      return;
    }
    setRenaming(true);
    try {
      const updated = await updateLocationMediaAlt(renameItem.id, next);
      library.replace(updated);
      setRenameId(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not rename media.");
    } finally {
      setRenaming(false);
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
            Upload photos and videos for this form. Add them to the landing page
            or a venue from those sections.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {library.items.length > 0 && (
            <button
              type="button"
              onClick={toggleAllLoaded}
              className="adm-btn-secondary px-3 py-1.5 text-xs"
            >
              {allLoadedSelected
                ? "Clear selection"
                : library.hasMore
                  ? `Select ${library.items.length}`
                  : "Select all"}
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
            {deleting
              ? "Deleting…"
              : unusedSelected.length > 0
                ? `Delete (${unusedSelected.length})`
                : "Delete"}
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
          <button
            type="button"
            onClick={() => void library.reload()}
            className="font-medium hover:underline"
          >
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
          <p className="px-4 py-10 text-center text-sm text-zinc-400">
            Loading media…
          </p>
        ) : library.items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-zinc-400">
            {uploading
              ? "Uploading…"
              : "Drop images or videos here, or click Upload."}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {library.items.map((item) => {
              const fileName = mediaFileName(item);
              const isSelected = selected.has(item.id);
              const menuOpen = menuId === item.id;
              return (
                <div
                  key={item.id}
                  className={`relative aspect-square ${menuOpen ? "z-20" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    aria-pressed={isSelected}
                    aria-label={`${isSelected ? "Deselect" : "Select"} ${fileName}`}
                    className={`absolute inset-0 overflow-hidden rounded-lg bg-zinc-100 text-left ring-offset-2 ${
                      isSelected
                        ? "ring-2 ring-blue-500"
                        : "hover:ring-2 hover:ring-zinc-300"
                    }`}
                  >
                    <MediaThumb
                      item={item}
                      preferThumb
                      className="h-full w-full object-cover"
                    />
                    <span
                      className={`absolute left-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded border text-white ${
                        isSelected
                          ? "border-blue-500 bg-blue-500"
                          : "border-white/80 bg-black/30"
                      }`}
                      aria-hidden
                    >
                      {isSelected && (
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </span>
                    <span
                      title={fileName}
                      className="absolute inset-x-1 bottom-1 truncate rounded bg-black/60 px-1 py-0.5 text-[9px] font-medium text-white"
                    >
                      {fileName}
                    </span>
                  </button>
                  <MediaActions
                    open={menuOpen}
                    fileName={fileName}
                    onOpenChange={(open) => setMenuId(open ? item.id : null)}
                    onDetails={() => {
                      setMenuId(null);
                      setDetailsId(item.id);
                    }}
                    onRename={() => {
                      setMenuId(null);
                      setRenameValue(fileName);
                      setRenameId(item.id);
                    }}
                  />
                </div>
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
          <p className="mt-2 text-center text-xs text-zinc-400">
            Loading more…
          </p>
        )}
      </div>

      {detailsItem && (
        <FileDetailsDialog
          item={detailsItem}
          usages={usagesFor(detailsItem.src)}
          onClose={() => setDetailsId(null)}
        />
      )}
      {renameItem && (
        <RenameDialog
          value={renameValue}
          saving={renaming}
          onChange={setRenameValue}
          onClose={() => {
            if (!renaming) setRenameId(null);
          }}
          onSave={() => void saveRename()}
        />
      )}
    </div>
  );
}

function MediaActions({
  open,
  fileName,
  onOpenChange,
  onDetails,
  onRename,
}: {
  open: boolean;
  fileName: string;
  onOpenChange: (open: boolean) => void;
  onDetails: () => void;
  onRename: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onOpenChange(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={ref} className="absolute right-1.5 top-1.5 z-10">
      <button
        type="button"
        aria-label={`Actions for ${fileName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/75"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
          <circle cx="10" cy="4.5" r="1.4" />
          <circle cx="10" cy="10" r="1.4" />
          <circle cx="10" cy="15.5" r="1.4" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={onDetails}
            className="block w-full px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50"
          >
            File details
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onRename}
            className="block w-full px-3 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-50"
          >
            Rename
          </button>
        </div>
      )}
    </div>
  );
}

function FileDetailsDialog({
  item,
  usages,
  onClose,
}: {
  item: LibraryMedia;
  usages: string[];
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rows = [
    ["File name", mediaFileName(item)],
    ["File type", mediaTypeLabel(item)],
    ["Used in", usages.length > 0 ? usages.join(", ") : "Not used"],
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans" role="dialog" aria-modal="true" aria-labelledby="media-details-title">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-zinc-900/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl">
        <h2 id="media-details-title" className="text-base font-semibold text-zinc-900">
          File details
        </h2>
        <dl className="mt-4 space-y-3">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-medium text-zinc-400">{label}</dt>
              <dd className="mt-0.5 break-words text-sm text-zinc-900">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className="adm-btn-secondary px-4 py-2 text-sm">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function RenameDialog({
  value,
  saving,
  onChange,
  onClose,
  onSave,
}: {
  value: string;
  saving: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans" role="dialog" aria-modal="true" aria-labelledby="media-rename-title">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-zinc-900/50" onClick={onClose} disabled={saving} />
      <form
        className="relative z-10 w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <h2 id="media-rename-title" className="text-base font-semibold text-zinc-900">
          Rename file
        </h2>
        <label className="mt-4 block text-xs font-medium text-zinc-400" htmlFor="media-rename-input">
          File name
        </label>
        <input
          id="media-rename-input"
          ref={inputRef}
          className="adm-input mt-1 w-full py-2 text-sm"
          value={value}
          disabled={saving}
          onChange={(event) => onChange(event.target.value)}
        />
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="adm-btn-secondary px-4 py-2 text-sm">
            Cancel
          </button>
          <button type="submit" disabled={saving || !value.trim()} className="adm-btn-primary px-4 py-2 text-sm">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
