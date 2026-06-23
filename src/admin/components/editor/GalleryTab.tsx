import { useRef, useState } from "react";
import type { MediaItem } from "../../../locations/types";
import { uploadGalleryFile } from "../../api";
import type { EditableLocation } from "../../pages/FormEditorPage";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
  orgId: string | null;
  onError: (msg: string) => void;
}

export default function GalleryTab({ draft, update, orgId, onError }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const media = draft.gallery_media;

  function setMedia(next: MediaItem[]) {
    update({ gallery_media: next });
  }

  function patchItem(index: number, patch: Partial<MediaItem>) {
    setMedia(media.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  function remove(index: number) {
    setMedia(media.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= media.length) return;
    const next = [...media];
    [next[index], next[target]] = [next[target]!, next[index]!];
    setMedia(next);
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Gallery media</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Images (and videos) shown on the landing page, in order.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="efb-btn-primary px-4 py-2"
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

      {media.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-gray-400">
          No media yet. Click <span className="font-medium">Upload</span> to add images.
        </div>
      ) : (
        <ul className="space-y-3">
          {media.map((item, i) => (
            <li
              key={`${item.src}-${i}`}
              className="flex gap-4 rounded-xl border border-slate-200 p-3"
            >
              <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {item.type === "video" ? (
                  <video src={item.src} className="h-full w-full object-cover" />
                ) : (
                  <img
                    src={item.src}
                    alt={item.alt}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <input
                  className="efb-input py-2"
                  placeholder="Alt text (describe the image)"
                  value={item.alt}
                  onChange={(e) => patchItem(i, { alt: e.target.value })}
                />
                <div className="flex min-w-0 items-center gap-2 text-xs text-gray-400">
                  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-medium uppercase text-slate-500">
                    {item.type}
                  </span>
                  <span className="truncate">{filenameFromUrl(item.src)}</span>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-center justify-between gap-1">
                <div className="flex gap-1">
                  <IconButton label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                    <ArrowUpIcon />
                  </IconButton>
                  <IconButton
                    label="Move down"
                    onClick={() => move(i, 1)}
                    disabled={i === media.length - 1}
                  >
                    <ArrowDownIcon />
                  </IconButton>
                </div>
                <IconButton label="Remove" onClick={() => remove(i)} destructive>
                  <TrashIcon />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function filenameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    return decodeURIComponent(path.split("/").pop() || url);
  } catch {
    return url;
  }
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  destructive,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        destructive
          ? "border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
          : "border-slate-200 text-gray-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function ArrowUpIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
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
