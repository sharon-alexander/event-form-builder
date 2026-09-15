import type { StepId } from "../locations/types";

const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "UL",
  "OL",
  "LI",
  "STRONG",
  "B",
  "EM",
  "I",
  "H1",
  "H2",
  "H3",
]);
const REMOVE_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "LINK",
  "META",
  "IMG",
  "VIDEO",
  "AUDIO",
  "SOURCE",
  "SVG",
]);
const ALLOWED_TEXT_ALIGN = new Set(["left", "center", "right", "justify"]);

/** Keep only a safe `text-align` value from an inline style, if present. */
function safeTextAlign(style: string | null | undefined): string | null {
  if (!style) return null;
  const match = /(?:^|;)\s*text-align\s*:\s*(left|center|right|justify)\s*(?:;|$)/i.exec(
    style,
  );
  if (!match?.[1]) return null;
  const value = match[1].toLowerCase();
  return ALLOWED_TEXT_ALIGN.has(value) ? value : null;
}

/** Keep only a safe text-align from style or the legacy align attribute. */
function safeAlignFromElement(el: HTMLElement): string | null {
  const fromStyle = safeTextAlign(el.getAttribute("style"));
  if (fromStyle) return fromStyle;
  const attr = el.getAttribute("align")?.toLowerCase();
  return attr && ALLOWED_TEXT_ALIGN.has(attr) ? attr : null;
}

function applySafeTextAlign(el: HTMLElement, from: HTMLElement) {
  const align = safeAlignFromElement(from);
  if (align) el.setAttribute("style", `text-align: ${align}`);
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function looksLikeHtml(value: string): boolean {
  // Contenteditable often emits entities with no tags (`hello&nbsp;`). Treat
  // those as HTML so toDisplayHtml does not escape `&` a second time.
  return (
    /<\/?[a-z][\s\S]*>/i.test(value) || /&(?:[a-z]+|#\d+|#x[\da-f]+);/i.test(value)
  );
}

export function isEmptyRichText(html: string): boolean {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim() === "";
}

/** Strip attributes and disallowed tags, keeping a small formatting allowlist. */
export function sanitizeRichText(html: string): string {
  if (typeof DOMParser === "undefined") return escapeHtml(html);

  const doc = new DOMParser().parseFromString(html, "text/html");
  scrub(doc.body);
  return doc.body.innerHTML;
}

function scrub(root: Element) {
  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType === Node.COMMENT_NODE) {
      child.parentNode?.removeChild(child);
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;

    const el = child as HTMLElement;
    const tag = el.tagName;

    if (REMOVE_TAGS.has(tag)) {
      el.remove();
      continue;
    }

    if (tag === "DIV") {
      const p = el.ownerDocument.createElement("p");
      applySafeTextAlign(p, el);
      while (el.firstChild) p.appendChild(el.firstChild);
      el.replaceWith(p);
      scrub(p);
      continue;
    }

    if (!ALLOWED_TAGS.has(tag)) {
      const parent = el.parentNode;
      if (!parent) {
        el.remove();
        continue;
      }
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      el.remove();
      continue;
    }

    const align = safeAlignFromElement(el);
    for (const attr of Array.from(el.attributes)) {
      el.removeAttribute(attr.name);
    }
    if (align) el.setAttribute("style", `text-align: ${align}`);
    scrub(el);
  }
}

/** Render stored more-details (HTML or legacy plain text) as safe HTML. */
export function toDisplayHtml(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "";
  if (looksLikeHtml(trimmed)) return sanitizeRichText(trimmed);
  return escapeHtml(trimmed).replace(/\n/g, "<br>");
}

/**
 * If Extra Info for the acknowledgement step is empty, copy leftover JSON
 * (`intro` / `sections`) from `info_page` so older saved rows still render.
 */
export function mergeInfoPageIntoMoreDetails(
  moreDetails: Partial<Record<StepId, string>>,
  infoPage: unknown,
): Partial<Record<StepId, string>> {
  if (moreDetails.info_acknowledge && !isEmptyRichText(moreDetails.info_acknowledge)) {
    return moreDetails;
  }
  const html = storedInfoPageToHtml(infoPage);
  if (!html) return moreDetails;
  return { ...moreDetails, info_acknowledge: html };
}

function storedInfoPageToHtml(page: unknown): string {
  if (!page || typeof page !== "object") return "";
  const { intro, sections } = page as {
    intro?: unknown;
    sections?: unknown;
  };

  const parts: string[] = [];
  if (typeof intro === "string" && intro.trim()) {
    parts.push(`<p>${escapeHtml(intro.trim())}</p>`);
  }
  if (!Array.isArray(sections)) return parts.join("");

  for (const section of sections) {
    if (!section || typeof section !== "object") continue;
    const { heading, body, bullets } = section as {
      heading?: unknown;
      body?: unknown;
      bullets?: unknown;
    };
    if (typeof heading === "string" && heading.trim()) {
      parts.push(`<p><strong>${escapeHtml(heading.trim())}</strong></p>`);
    }
    if (typeof body === "string" && body.trim()) {
      parts.push(`<p>${escapeHtml(body.trim())}</p>`);
    }
    if (Array.isArray(bullets)) {
      const items = bullets
        .filter((b): b is string => typeof b === "string" && !!b.trim())
        .map((b) => `<li>${escapeHtml(b.trim())}</li>`);
      if (items.length > 0) parts.push(`<ul>${items.join("")}</ul>`);
    }
  }
  return parts.join("");
}
