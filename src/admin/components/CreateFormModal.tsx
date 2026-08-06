import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, slug: string) => Promise<void>;
  creating: boolean;
  error: string | null;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CreateFormModal({ open, onClose, onCreate, creating, error }: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setSlug("");
      setSlugTouched(false);
    }
  }, [open]);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    await onCreate(name.trim(), slugify(slug));
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900";
  const labelClass = "mb-1.5 block text-sm font-medium text-zinc-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
        onClick={creating ? undefined : onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">New event form</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Create a new form for your organization.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="form-name" className={labelClass}>Name</label>
            <input
              id="form-name"
              className={inputClass}
              placeholder='e.g. "Downtown Loft"'
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="form-slug" className={labelClass}>URL slug</label>
            <input
              id="form-slug"
              className={inputClass}
              placeholder="downtown-loft"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
            <p className="mt-1.5 text-xs text-zinc-400">
              Used at <span className="font-mono">/form/{slug || "your-slug"}</span> — lowercase, globally unique.
            </p>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !name.trim() || !slug.trim()}
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create form"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
