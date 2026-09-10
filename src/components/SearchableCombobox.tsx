import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export type ComboboxOption = {
  value: string;
  label: string;
};

interface Props {
  id?: string;
  value: string | null;
  options: ComboboxOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export default function SearchableCombobox({
  id,
  value,
  options,
  onChange,
  placeholder = "Search…",
  "aria-label": ariaLabel,
}: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const listId = `${inputId}-list`;

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selected?.label ?? "");
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedLabel = selected?.label ?? "";

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q || q === normalize(selectedLabel)) return options;
    return options.filter((o) => normalize(o.label).includes(q));
  }, [options, query, selectedLabel]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery(selected?.label ?? "");
  }, [selected?.label]);

  const select = useCallback(
    (option: ComboboxOption) => {
      onChange(option.value);
      setQuery(option.label);
      setOpen(false);
      inputRef.current?.focus();
    },
    [onChange],
  );

  const openList = useCallback(() => {
    setQuery(selected?.label ?? "");
    const idx = options.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 ? idx : 0);
    setOpen(true);
  }, [options, selected?.label, value]);

  useEffect(() => {
    if (open) return;
    setQuery(selected?.label ?? "");
  }, [open, selected?.label]);

  useEffect(() => {
    if (!open) return;
    const selectedIdx = filtered.findIndex((o) => o.value === value);
    setActiveIndex(selectedIdx >= 0 ? selectedIdx : 0);
  }, [filtered, open, value]);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    if (!list || !el) return;
    const listRect = list.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    if (elRect.top < listRect.top) {
      list.scrollTop -= listRect.top - elRect.top;
    } else if (elRect.bottom > listRect.bottom) {
      list.scrollTop += elRect.bottom - listRect.bottom;
    }
  }, [activeIndex, open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      const root = rootRef.current;
      if (!root) return;
      if (e.composedPath().includes(root)) return;
      close();
    }

    // Attach after the opening click so that same gesture cannot close the list.
    const timer = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, close]);

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setActiveIndex((i) =>
        filtered.length === 0 ? 0 : Math.min(i + 1, filtered.length - 1),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Home") {
      if (!open) return;
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      if (!open) return;
      e.preventDefault();
      setActiveIndex(Math.max(filtered.length - 1, 0));
    } else if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      const option = filtered[activeIndex];
      if (option) select(option);
    } else if (e.key === "Escape") {
      if (!open) return;
      e.preventDefault();
      close();
    }
  }

  const active = filtered[activeIndex];

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && active ? `${listId}-${active.value}` : undefined}
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (!open) openList();
            inputRef.current?.select();
          }}
          onClick={() => {
            if (!open) openList();
          }}
          onKeyDown={onKeyDown}
          className="efb-input pr-10"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? "Close options" : "Show options"}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (open) close();
            else {
              openList();
              inputRef.current?.focus();
              inputRef.current?.select();
            }
          }}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
        >
          <svg
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-brand-200 bg-white py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-2.5 text-sm text-gray-400">No matches</li>
          ) : (
            filtered.map((option, index) => {
              const isActive = index === activeIndex;
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value}
                  id={`${listId}-${option.value}`}
                  role="option"
                  aria-selected={isSelected}
                  data-index={index}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => select(option)}
                  className={`flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm ${
                    isActive ? "bg-brand-50 text-gray-900" : "text-gray-700"
                  } ${isSelected ? "font-medium" : ""}`}
                >
                  {option.label}
                  {isSelected && (
                    <svg
                      className="h-4 w-4 text-brand-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
