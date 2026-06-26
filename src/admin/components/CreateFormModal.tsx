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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={creating ? undefined : onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="font-display text-xl font-semibold text-gray-900">New event form</h2>
        <p className="mt-1 text-sm text-gray-500">
          Create a new form for your organization.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="form-name" className="efb-label">Name</label>
            <input
              id="form-name"
              className="efb-input"
              placeholder='e.g. "Downtown Loft"'
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="form-slug" className="efb-label">URL slug</label>
            <input
              id="form-slug"
              className="efb-input"
              placeholder="downtown-loft"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
            <p className="mt-1 text-xs text-gray-400">
              Used at /form/{slug || "your-slug"} — lowercase, globally unique.
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="efb-btn-secondary px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !name.trim() || !slug.trim()}
              className="efb-btn-primary px-4 py-2"
            >
              {creating ? "Creating…" : "Create form"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
