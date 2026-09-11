import type { MediaEmbedProvider, MediaItem } from "../../locations/types";
import type { ParsedVideoEmbed, VideoEmbedProvider } from "./types";
import { vimeoProvider } from "./vimeo";

export type { ParsedVideoEmbed, VideoEmbedProvider };

const PROVIDERS: VideoEmbedProvider[] = [vimeoProvider];

const byId = new Map(PROVIDERS.map((p) => [p.id, p]));

export function getEmbedProvider(
  id: MediaEmbedProvider | undefined,
): VideoEmbedProvider | undefined {
  if (!id) return undefined;
  return byId.get(id);
}

export function parseVideoEmbed(input: string): ParsedVideoEmbed | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  for (const provider of PROVIDERS) {
    const parsed = provider.parse(trimmed);
    if (parsed) return parsed;
  }
  return null;
}

export function embedHostAllowed(src: string): boolean {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  return PROVIDERS.some((p) => p.allowedHosts.includes(url.hostname));
}

export function providerLabel(id: MediaEmbedProvider | undefined): string {
  return getEmbedProvider(id)?.label ?? "Embed";
}

export function supportedEmbedLabels(): string {
  const labels = PROVIDERS.map((p) => p.label);
  if (labels.length <= 1) return labels[0] ?? "video";
  const last = labels[labels.length - 1];
  return `${labels.slice(0, -1).join(", ")} or ${last}`;
}

export function mediaKindLabel(item: MediaItem): string | null {
  if (item.type === "embed") return providerLabel(item.provider);
  if (item.type === "video") return "Video";
  return null;
}

export function providerForItem(
  item: MediaItem,
): VideoEmbedProvider | undefined {
  if (item.type !== "embed") return undefined;
  const byProvider = getEmbedProvider(item.provider);
  if (byProvider) return byProvider;
  try {
    const host = new URL(item.src).hostname;
    return PROVIDERS.find((p) => p.allowedHosts.includes(host));
  } catch {
    return undefined;
  }
}
