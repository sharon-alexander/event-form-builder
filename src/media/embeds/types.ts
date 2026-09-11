import type { MediaEmbedProvider } from "../../locations/types";

export interface ParsedVideoEmbed {
  provider: MediaEmbedProvider;
  src: string;
  videoId: string;
  title?: string;
}

export interface VideoEmbedProvider {
  id: MediaEmbedProvider;
  label: string;
  allowedHosts: string[];
  parse(input: string): ParsedVideoEmbed | null;
  fetchPoster?(parsed: ParsedVideoEmbed): Promise<string | undefined>;
  iframeAllow: string;
}
