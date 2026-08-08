import { type DragEvent, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MediaItem } from "../../../locations/types";
import { uploadGalleryFile } from "../../api";
import { collectFormMedia } from "../../utils/formMediaLibrary";
import type { EditableLocation } from "../../pages/FormEditorPage";
import MediaPicker from "./MediaPicker";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
  orgId: string | null;
  onError: (msg: string) => void;
}

function stableId(item: MediaItem, index: number) {
  return `${item.src}::${index}`;
}

export default function GalleryTab({ draft, update, orgId, onError }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const media = draft.gallery_media;
  const libraryMedia = collectFormMedia(draft);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const sortableIds = media.map((item, i) => stableId(item, i));

  function setMedia(next: MediaItem[]) {
    update({ gallery_media: next });
  }

  function patchItem(index: number, patch: Partial<MediaItem>) {
    setMedia(media.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  function remove(index: number) {
    setMedia(media.filter((_, i) => i !== index));
    if (selectedIndex === index) setSelectedIndex(null);
    else if (selectedIndex !== null && selectedIndex > index) {
      setSelectedIndex(selectedIndex - 1);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setDragActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortableIds.indexOf(active.id as string);
    const newIndex = sortableIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(media, oldIndex, newIndex);
    setMedia(next);
    if (selectedIndex === oldIndex) setSelectedIndex(newIndex);
    else if (selectedIndex !== null) {
      if (oldIndex < selectedIndex && newIndex >= selectedIndex) {
        setSelectedIndex(selectedIndex - 1);
      } else if (oldIndex > selectedIndex && newIndex <= selectedIndex) {
        setSelectedIndex(selectedIndex + 1);
      }
    }
  }

  function addExisting(item: MediaItem) {
    if (media.some((m) => m.src === item.src)) return;
    setMedia([...media, item]);
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
        const url = await uploadGalleryFile(orgId, draft.slug, file);
        uploaded.push({
          type: file.type.startsWith("video") ? "video" : "image",
          src: url,
          alt: file.name.replace(/\.[^.]+$/, ""),
        });
      }
      setMedia([...media, ...uploaded]);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFiles(files);
  }

  function handleDragOverFile(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
  }

  const selectedItem = selectedIndex !== null ? media[selectedIndex] : null;
  const dragActiveItem = dragActiveId
    ? media[sortableIds.indexOf(dragActiveId)]
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Gallery</h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Drag to reorder. Click to edit caption.
          </p>
        </div>
        <div className="flex gap-2">
          {libraryMedia.length > 0 && (
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="adm-btn-secondary px-4 py-2"
            >
              {pickerOpen ? "Cancel" : "Choose existing"}
            </button>
          )}
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="adm-btn-primary px-4 py-2"
          >
            {uploading ? "Uploading…" : "+"}
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

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOverFile}
        onDragLeave={handleDragLeave}
        className={`rounded-xl border-2 border-dashed p-2 transition-colors ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : media.length === 0
              ? "border-zinc-300"
              : "border-transparent"
        }`}
      >
        {media.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-400">
            {uploading
              ? "Uploading…"
              : "Drop images or videos here, or click + to upload."}
          </div>
        ) : (
          <div className="flex gap-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
                <div className="grid flex-1 grid-cols-3 gap-2">
                  {media.map((item, i) => (
                    <SortableTile
                      key={stableId(item, i)}
                      id={stableId(item, i)}
                      item={item}
                      selected={selectedIndex === i}
                      isDragOverlay={false}
                      onClick={() => setSelectedIndex(selectedIndex === i ? null : i)}
                      onDelete={() => remove(i)}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {dragActiveItem ? (
                  <TileContent item={dragActiveItem} selected={false} isOverlay />
                ) : null}
              </DragOverlay>
            </DndContext>

            {selectedItem && selectedIndex !== null && (
              <div className="w-72 shrink-0 space-y-4 rounded-xl border border-zinc-200 p-4">
                <div className="overflow-hidden rounded-lg bg-zinc-100">
                  {selectedItem.type === "video" ? (
                    <video
                      src={selectedItem.src}
                      className="h-48 w-full object-cover"
                      controls
                    />
                  ) : (
                    <img
                      src={selectedItem.src}
                      alt={selectedItem.alt}
                      className="h-48 w-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Caption
                  </label>
                  <textarea
                    className="adm-input w-full resize-none py-2 text-sm"
                    rows={3}
                    placeholder="Describe this media..."
                    value={selectedItem.alt}
                    onChange={(e) => patchItem(selectedIndex, { alt: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TileContent({
  item,
  selected,
  isOverlay,
}: {
  item: MediaItem;
  selected: boolean;
  isOverlay?: boolean;
}) {
  return (
    <div
      className={`relative aspect-square overflow-hidden rounded-lg bg-zinc-100 ring-offset-2 ${
        isOverlay
          ? "ring-2 ring-blue-500 shadow-lg"
          : selected
            ? "ring-2 ring-blue-500"
            : ""
      }`}
    >
      {item.type === "video" ? (
        <video src={item.src} className="h-full w-full object-cover" muted />
      ) : (
        <img src={item.src} alt={item.alt} className="h-full w-full object-cover" />
      )}
      {item.type === "video" && (
        <div className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white">
          Video
        </div>
      )}
    </div>
  );
}

function SortableTile({
  id,
  item,
  selected,
  onClick,
  onDelete,
}: {
  id: string;
  item: MediaItem;
  selected: boolean;
  isDragOverlay: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative aspect-square cursor-grab overflow-hidden rounded-lg bg-zinc-100 ring-offset-2 transition-shadow active:cursor-grabbing ${
        selected ? "ring-2 ring-blue-500" : "hover:ring-2 hover:ring-zinc-300"
      }`}
      onClick={onClick}
    >
      {item.type === "video" ? (
        <video src={item.src} className="h-full w-full object-cover" muted />
      ) : (
        <img src={item.src} alt={item.alt} className="h-full w-full object-cover" />
      )}

      {item.type === "video" && (
        <div className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white">
          Video
        </div>
      )}

      <button
        type="button"
        aria-label="Delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
}
