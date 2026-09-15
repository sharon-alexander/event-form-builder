import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  isEmptyRichText,
  sanitizeRichText,
  toDisplayHtml,
} from "../../../utils/richText";

interface Props {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

type BlockTag = "p" | "h1" | "h2" | "h3";

const BLOCK_OPTIONS: { value: BlockTag; label: string }[] = [
  { value: "p", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
];

export default function RichTextEditor({
  id,
  value,
  onChange,
  placeholder,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const focused = useRef(false);
  const savedRange = useRef<Range | null>(null);
  const [marks, setMarks] = useState({
    bold: false,
    ul: false,
    ol: false,
    block: "p" as BlockTag,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || focused.current) return;
    const html = toDisplayHtml(value);
    if (el.innerHTML !== html) el.innerHTML = html;
  }, [value]);

  function emit(html: string) {
    const cleaned = sanitizeRichText(html);
    onChange(isEmptyRichText(cleaned) ? "" : cleaned);
  }

  function rememberSelection() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (ref.current?.contains(range.commonAncestorContainer)) {
      savedRange.current = range.cloneRange();
    }
  }

  function restoreSelection() {
    const range = savedRange.current;
    if (!range) return;
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function refreshMarks() {
    try {
      const raw = document.queryCommandValue("formatBlock").toLowerCase();
      const block: BlockTag =
        raw === "h1" || raw === "h2" || raw === "h3" ? raw : "p";
      setMarks({
        bold: document.queryCommandState("bold"),
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList"),
        block,
        alignLeft: document.queryCommandState("justifyLeft"),
        alignCenter: document.queryCommandState("justifyCenter"),
        alignRight: document.queryCommandState("justifyRight"),
        alignJustify: document.queryCommandState("justifyFull"),
      });
    } catch {
      /* queryCommandState can throw if the selection isn't in the editor */
    }
  }

  function exec(command: string, commandValue?: string) {
    ref.current?.focus();
    restoreSelection();
    document.execCommand(command, false, commandValue);
    emit(ref.current?.innerHTML ?? "");
    rememberSelection();
    refreshMarks();
  }

  function setBlock(tag: BlockTag) {
    // Safari expects the tag wrapped in angle brackets.
    exec("formatBlock", `<${tag}>`);
  }

  const empty = isEmptyRichText(value);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-300 bg-white focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 bg-zinc-50 px-1.5 py-1">
        <label className="sr-only" htmlFor={id ? `${id}-block` : undefined}>
          Text style
        </label>
        <select
          id={id ? `${id}-block` : undefined}
          title="Text style"
          aria-label="Text style"
          className="mr-0.5 h-7 max-w-[7.5rem] rounded border-0 bg-transparent px-1 text-xs text-zinc-700 outline-none hover:bg-zinc-200 focus:bg-white focus:ring-1 focus:ring-zinc-900"
          value={marks.block}
          onMouseDown={rememberSelection}
          onChange={(e) => setBlock(e.target.value as BlockTag)}
        >
          {BLOCK_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <ToolbarDivider />

        <ToolbarButton
          label="Bold"
          active={marks.bold}
          onClick={() => exec("bold")}
        >
          <span className="font-serif font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton
          label="Bulleted list"
          active={marks.ul}
          onClick={() => exec("insertUnorderedList")}
        >
          <ListIcon ordered={false} />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={marks.ol}
          onClick={() => exec("insertOrderedList")}
        >
          <ListIcon ordered />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          label="Align left"
          active={marks.alignLeft}
          onClick={() => exec("justifyLeft")}
        >
          <AlignIcon align="left" />
        </ToolbarButton>
        <ToolbarButton
          label="Align center"
          active={marks.alignCenter}
          onClick={() => exec("justifyCenter")}
        >
          <AlignIcon align="center" />
        </ToolbarButton>
        <ToolbarButton
          label="Align right"
          active={marks.alignRight}
          onClick={() => exec("justifyRight")}
        >
          <AlignIcon align="right" />
        </ToolbarButton>
        <ToolbarButton
          label="Justify"
          active={marks.alignJustify}
          onClick={() => exec("justifyFull")}
        >
          <AlignIcon align="justify" />
        </ToolbarButton>
      </div>

      <div
        ref={ref}
        id={id}
        role="textbox"
        aria-multiline
        contentEditable
        data-placeholder={placeholder}
        className={`adm-rich-editor efb-rich-text ${empty ? "adm-rich-editor--empty" : ""}`}
        onFocus={() => {
          focused.current = true;
          refreshMarks();
        }}
        onBlur={() => {
          focused.current = false;
          emit(ref.current?.innerHTML ?? "");
        }}
        onInput={() => emit(ref.current?.innerHTML ?? "")}
        onKeyUp={() => {
          rememberSelection();
          refreshMarks();
        }}
        onMouseUp={() => {
          rememberSelection();
          refreshMarks();
        }}
        onPaste={(e) => {
          e.preventDefault();
          const html = e.clipboardData.getData("text/html");
          const text = e.clipboardData.getData("text/plain");
          if (html) {
            document.execCommand("insertHTML", false, sanitizeRichText(html));
          } else {
            document.execCommand("insertText", false, text);
          }
          emit(ref.current?.innerHTML ?? "");
        }}
      />
    </div>
  );
}

function ToolbarDivider() {
  return <span className="mx-0.5 h-4 w-px shrink-0 bg-zinc-200" aria-hidden />;
}

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-7 w-7 items-center justify-center rounded text-sm ${
        active
          ? "bg-zinc-900 text-white"
          : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
      }`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ListIcon({ ordered }: { ordered: boolean }) {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      {ordered ? (
        <>
          <text x="0" y="6" fontSize="5.5" fontWeight="700">
            1
          </text>
          <text x="0" y="13.5" fontSize="5.5" fontWeight="700">
            2
          </text>
          <rect x="6" y="3.5" width="10" height="1.4" rx="0.5" />
          <rect x="6" y="11" width="10" height="1.4" rx="0.5" />
        </>
      ) : (
        <>
          <circle cx="2" cy="4.2" r="1.2" />
          <circle cx="2" cy="11.8" r="1.2" />
          <rect x="5.5" y="3.5" width="10.5" height="1.4" rx="0.5" />
          <rect x="5.5" y="11.1" width="10.5" height="1.4" rx="0.5" />
        </>
      )}
    </svg>
  );
}

function AlignIcon({
  align,
}: {
  align: "left" | "center" | "right" | "justify";
}) {
  const lines =
    align === "left"
      ? [
          [1, 14],
          [1, 10],
          [1, 14],
          [1, 8],
        ]
      : align === "center"
        ? [
            [1, 14],
            [3, 10],
            [1, 14],
            [4, 8],
          ]
        : align === "right"
          ? [
              [1, 14],
              [5, 10],
              [1, 14],
              [7, 8],
            ]
          : [
              [1, 14],
              [1, 14],
              [1, 14],
              [1, 14],
            ];

  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      {lines.map(([x, w], i) => (
        <rect key={i} x={x} y={2 + i * 3.5} width={w} height={1.4} rx="0.5" />
      ))}
    </svg>
  );
}
