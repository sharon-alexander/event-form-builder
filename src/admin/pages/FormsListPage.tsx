import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { LocationRow } from "../../locations/fromDb";
import { useAuth } from "../auth";
import { createLocation, deleteLocation, listLocations, updateLocation } from "../api";

export default function FormsListPage() {
  const { org } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setForms(await listLocations());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load forms.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate() {
    if (!org) return;
    const name = window.prompt("Name for the new event form (e.g. \"Downtown Loft\")");
    if (!name) return;
    const suggested = slugify(name);
    const slug = window.prompt(
      "URL slug (lowercase, used in /form/<slug>). Must be globally unique.",
      suggested,
    );
    if (!slug) return;

    setCreating(true);
    setError(null);
    try {
      await createLocation(org.id, { name: name.trim(), slug: slugify(slug) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create form.");
    } finally {
      setCreating(false);
    }
  }

  async function handleTogglePublish(form: LocationRow) {
    try {
      await updateLocation(form.id, { published: !form.published });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update.");
    }
  }

  async function handleDelete(form: LocationRow) {
    if (!window.confirm(`Delete "${form.name}"? This cannot be undone.`)) return;
    try {
      await deleteLocation(form.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">
            Event Forms
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the forms for {org?.name ?? "your group"}.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="efb-btn-primary"
        >
          {creating ? "Creating…" : "New form"}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : forms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-gray-500">
            No forms yet. Click <span className="font-medium">New form</span> to create one.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {forms.map((form) => (
            <li
              key={form.id}
              onClick={() => navigate(`/forms/${form.id}`)}
              className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-gray-900">{form.name}</span>
                  <StatusBadge published={form.published} />
                </div>
              </div>
              <RowMenu
                form={form}
                onEdit={() => navigate(`/forms/${form.id}`)}
                onPreview={() =>
                  window.open(`/form/${encodeURIComponent(form.slug)}`, "_blank")
                }
                onTogglePublish={() => handleTogglePublish(form)}
                onDelete={() => handleDelete(form)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RowMenu({
  form,
  onEdit,
  onPreview,
  onTogglePublish,
  onDelete,
}: {
  form: LocationRow;
  onEdit: () => void;
  onPreview: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-slate-100 hover:text-gray-600"
        aria-label="Actions"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="10" cy="16" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <MenuButton
            onClick={() => {
              setOpen(false);
              onPreview();
            }}
          >
            Preview
          </MenuButton>
          <MenuButton
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            Edit
          </MenuButton>
          <MenuButton
            onClick={() => {
              setOpen(false);
              onTogglePublish();
            }}
          >
            {form.published ? "Unpublish" : "Publish"}
          </MenuButton>
          <div className="my-1 border-t border-slate-100" />
          <MenuButton
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            destructive
          >
            Delete
          </MenuButton>
        </div>
      )}
    </div>
  );
}

function MenuButton({
  children,
  onClick,
  destructive,
}: {
  children: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-full px-4 py-2 text-left text-sm transition-colors ${
        destructive
          ? "text-red-600 hover:bg-red-50"
          : "text-gray-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ published }: { published: boolean }) {
  return published ? (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      Published
    </span>
  ) : (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
      Draft
    </span>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
