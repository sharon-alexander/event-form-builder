import { useEffect, useRef, useState } from "react";
import type { EventChoiceOption } from "../../../locations/types";

interface Props {
  title: string;
  hint?: string;
  catalog: EventChoiceOption[];
  selected: EventChoiceOption[];
  onChange: (next: EventChoiceOption[]) => void;
}

function slugifyValue(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function uniqueValue(label: string, taken: string[]): string {
  const base = slugifyValue(label) || "option";
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}_${n}`)) n += 1;
  return `${base}_${n}`;
}

function catalogValues(catalog: EventChoiceOption[]): Set<string> {
  return new Set(catalog.map((c) => c.value));
}

function rebuild(
  catalog: EventChoiceOption[],
  selected: EventChoiceOption[],
  enabledCatalog: Set<string>,
): EventChoiceOption[] {
  const catalogSet = catalogValues(catalog);
  const customs = selected.filter((s) => !catalogSet.has(s.value));
  return [
    ...catalog.filter((c) => enabledCatalog.has(c.value)),
    ...customs,
  ];
}

export default function ChoiceListEditor({
  title,
  hint,
  catalog,
  selected = [],
  onChange,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!adding) return;
    inputRef.current?.focus();
  }, [adding]);

  const selectedValues = new Set(selected.map((s) => s.value));
  const catalogSet = catalogValues(catalog);
  const customs = selected.filter((s) => !catalogSet.has(s.value));

  function toggleCatalog(value: string) {
    const nextEnabled = new Set(selectedValues);
    if (nextEnabled.has(value)) nextEnabled.delete(value);
    else nextEnabled.add(value);
    onChange(rebuild(catalog, selected, nextEnabled));
  }

  function removeCustom(value: string) {
    onChange(selected.filter((s) => s.value !== value));
  }

  function commitAdd() {
    const label = draft.trim();
    if (!label) {
      setAdding(false);
      setDraft("");
      return;
    }

    const catalogMatch = catalog.find(
      (c) => c.label.toLowerCase() === label.toLowerCase(),
    );
    if (catalogMatch) {
      if (!selectedValues.has(catalogMatch.value)) {
        const nextEnabled = new Set(selectedValues);
        nextEnabled.add(catalogMatch.value);
        onChange(rebuild(catalog, selected, nextEnabled));
      }
      setAdding(false);
      setDraft("");
      return;
    }

    if (selected.some((s) => s.label.toLowerCase() === label.toLowerCase())) {
      setAdding(false);
      setDraft("");
      return;
    }

    const value = uniqueValue(label, [
      ...catalog.map((c) => c.value),
      ...selected.map((s) => s.value),
    ]);
    onChange([...rebuild(catalog, selected, selectedValues), { value, label }]);
    setAdding(false);
    setDraft("");
  }

  function cancelAdd() {
    setAdding(false);
    setDraft("");
  }

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {catalog.map((item) => {
          const on = selectedValues.has(item.value);
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={on}
              onClick={() => toggleCatalog(item.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                on
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {item.label}
            </button>
          );
        })}
        {customs.map((item) => (
          <span
            key={item.value}
            className="inline-flex items-center gap-1 rounded-full border border-zinc-900 bg-zinc-900 pl-3 pr-1.5 py-1 text-xs font-medium text-white"
          >
            {item.label}
            <button
              type="button"
              aria-label={`Remove ${item.label}`}
              onClick={() => removeCustom(item.value)}
              className="flex h-4 w-4 items-center justify-center rounded-full text-white/70 hover:bg-white/20 hover:text-white"
            >
              ×
            </button>
          </span>
        ))}
        {adding ? (
          <input
            ref={inputRef}
            className="h-8 w-36 rounded-full border border-zinc-900 px-3 text-xs text-zinc-900 outline-none focus:ring-1 focus:ring-zinc-900"
            placeholder="New option"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitAdd();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                cancelAdd();
              }
            }}
            onBlur={commitAdd}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-full border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:border-zinc-500 hover:text-zinc-700"
          >
            + Add
          </button>
        )}
      </div>
    </section>
  );
}
