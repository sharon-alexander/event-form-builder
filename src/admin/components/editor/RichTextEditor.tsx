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

export default function RichTextEditor({
  id,
  value,
  onChange,
  placeholder,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const focused = useRef(false);
  const [marks, setMarks] = useState({ bold: false, ul: false, ol: false });

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

  function refreshMarks() {
    try {
      setMarks({
        bold: document.queryCommandState("bold"),
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList"),
      });
    } catch {
      /* queryCommandState can throw if the selection isn't in the editor */
    }
  }

  function exec(command: string) {
    ref.current?.focus();
    document.execCommand(command, false);
    emit(ref.current?.innerHTML ?? "");
    refreshMarks();
  }

  const empty = isEmptyRichText(value);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-300 bg-white focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900">
      <div className="flex items-center gap-0.5 border-b border-zinc-200 bg-zinc-50 px-1.5 py-1">
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
        onKeyUp={refreshMarks}
        onMouseUp={refreshMarks}
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
