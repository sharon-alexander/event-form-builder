import { useState } from "react";
import type { MediaItem } from "../../../locations/types";
import {
  getEmbedProvider,
  parseVideoEmbed,
  supportedEmbedLabels,
} from "../../../media/embeds";

interface Props {
  existingSrcs: string[];
  onAdd: (item: MediaItem) => void;
  onError: (msg: string) => void;
}

export default function EmbedPasteField({ existingSrcs, onAdd, onError }: Props) {
  const [value, setValue] = useState("");
  const [adding, setAdding] = useState(false);
  const labels = supportedEmbedLabels();

  async function submit() {
    const parsed = parseVideoEmbed(value);
    if (!parsed) {
      onError(`Paste a ${labels} URL or iframe.`);
      return;
    }
    if (existingSrcs.includes(parsed.src)) {
      onError("That video is already in this gallery.");
      return;
    }
    setAdding(true);
    try {
      const provider = getEmbedProvider(parsed.provider);
      let poster: string | undefined;
      try {
        poster = await provider?.fetchPoster?.(parsed);
      } catch {
        poster = undefined;
      }
      onAdd({
        type: "embed",
        provider: parsed.provider,
        src: parsed.src,
        poster,
        alt: parsed.title ?? "",
      });
      setValue("");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <textarea
        className="adm-input min-h-[2.5rem] w-full resize-none py-2 text-sm"
        rows={2}
        placeholder={`Paste a ${labels} URL or iframe`}
        value={value}
        disabled={adding}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void submit();
          }
        }}
      />
      <button
        type="button"
        onClick={() => void submit()}
        disabled={adding || !value.trim()}
        className="adm-btn-secondary shrink-0 px-3 py-2 text-xs"
      >
        {adding ? "Adding…" : "Add embed"}
      </button>
    </div>
  );
}
