import type { ParsedVideoEmbed, VideoEmbedProvider } from "./types";

const VIDEO_ID = /^\d+$/;
const HASH = /^[a-f0-9]+$/i;

function iframeSrc(input: string): string | null {
  if (!/<iframe[\s>]/i.test(input)) return null;
  const match = input.match(/\ssrc\s*=\s*["']([^"']+)["']/i);
  return match?.[1]?.replace(/&amp;/g, "&") ?? null;
}

function parseVimeoUrl(raw: string): ParsedVideoEmbed | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  url.protocol = "https:";

  const host = url.hostname.replace(/^www\./, "");
  let videoId: string | undefined;
  let hash: string | undefined;

  if (host === "player.vimeo.com") {
    const match = url.pathname.match(/^\/video\/(\d+)\/?$/);
    if (!match?.[1]) return null;
    videoId = match[1];
    hash = url.searchParams.get("h") ?? undefined;
  } else if (host === "vimeo.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    const idIndex = parts[0] === "video" ? 1 : 0;
    const id = parts[idIndex];
    if (!id || !VIDEO_ID.test(id)) return null;
    videoId = id;
    const next = parts[idIndex + 1];
    hash =
      next && HASH.test(next) ? next : (url.searchParams.get("h") ?? undefined);
  } else {
    return null;
  }

  const src = hash
    ? `https://player.vimeo.com/video/${videoId}?h=${encodeURIComponent(hash)}`
    : `https://player.vimeo.com/video/${videoId}`;

  return { provider: "vimeo", src, videoId };
}

export const vimeoProvider: VideoEmbedProvider = {
  id: "vimeo",
  label: "Vimeo",
  allowedHosts: ["player.vimeo.com"],
  iframeAllow:
    "autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share",
  parse(input) {
    const trimmed = input.trim();
    return parseVimeoUrl(iframeSrc(trimmed) ?? trimmed);
  },
  async fetchPoster(parsed) {
    const hash = new URL(parsed.src).searchParams.get("h");
    const pageUrl = hash
      ? `https://vimeo.com/${parsed.videoId}/${hash}`
      : `https://vimeo.com/${parsed.videoId}`;
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(pageUrl)}`,
    );
    if (!res.ok) return undefined;
    const data: unknown = await res.json();
    if (
      data &&
      typeof data === "object" &&
      "thumbnail_url" in data &&
      typeof data.thumbnail_url === "string"
    ) {
      return data.thumbnail_url;
    }
    return undefined;
  },
};
