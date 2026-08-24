import { useState } from "react";
import type { EditableLocation } from "../../pages/FormEditorPage";
import { buildEmbedCode, buildPublicFormUrl } from "../../embedCode";

interface Props {
  draft: EditableLocation;
}

export default function EmbedTab({ draft }: Props) {
  const embedCode = buildEmbedCode(draft.slug);
  const publicUrl = buildPublicFormUrl(draft.slug);
  const [copied, setCopied] = useState<"embed" | "preview" | null>(null);

  async function copy(text: string, which: "embed" | "preview") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-semibold text-zinc-900">Embed on your website</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Paste this snippet into any page that allows custom HTML and scripts. For example,
          in Squarespace, add a <span className="font-medium">Code</span> block and set the
          block type to HTML.
        </p>

        {!draft.published && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            This form is not published yet. Publish it before embedding so visitors can load
            the latest config.
          </p>
        )}

        <div className="relative mt-4">
          <pre className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 pr-14 text-xs leading-relaxed text-zinc-800">
            <code>{embedCode}</code>
          </pre>
          <div className="absolute right-3 top-3">
            <IconButton
              label={copied === "embed" ? "Copied" : "Copy embed code"}
              onClick={() => copy(embedCode, "embed")}
            >
              {copied === "embed" ? <CheckIcon /> : <CopyIcon />}
            </IconButton>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-900">Direct link</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Share a standalone page without embedding — useful for testing or email links.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
            {publicUrl}
          </code>
          <IconButton
            label={copied === "preview" ? "Copied" : "Copy link"}
            onClick={() => copy(publicUrl, "preview")}
          >
            {copied === "preview" ? <CheckIcon /> : <CopyIcon />}
          </IconButton>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open preview in new tab"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            <ExternalLinkIcon />
          </a>
        </div>
      </section>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50"
    >
      {children}
    </button>
  );
}

function CopyIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}
