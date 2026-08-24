import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { LocationRow } from "../../locations/fromDb";
import { useAuth } from "../auth";
import { createLocation, deleteLocation, listLocations, updateLocation } from "../api";
import { buildPreviewUrl } from "../embedCode";
import CreateFormModal from "../components/CreateFormModal";
import { DEFAULT_FORM_STEPS } from "../constants/defaultFormSteps";

export default function FormsListPage() {
  const { org } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "published">("all");

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

  async function handleCreate(name: string, slug: string) {
    if (!org) return;

    setCreating(true);
    setCreateError(null);
    try {
      const created = await createLocation(org.id, {
        name,
        slug,
        form_steps: DEFAULT_FORM_STEPS,
        timing_style: "standard",
      });
      setCreateModalOpen(false);
      await load();
      navigate(`/forms/${created.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create form.");
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

  const filteredForms =
    statusFilter === "published" ? forms.filter((f) => f.published) : forms;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Forms</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage the event forms for {org?.name ?? "your group"}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreateError(null);
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          New form
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && forms.length > 0 && (
        <div className="mb-4 flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
          {(
            [
              { value: "all", label: "All" },
              { value: "published", label: "Published" },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === value
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-xl border border-zinc-200 bg-white" />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <p className="text-sm text-zinc-500">
            No forms yet. Click <span className="font-medium text-zinc-700">New form</span> to create one.
          </p>
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <p className="text-sm text-zinc-500">No published forms.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {filteredForms.map((form) => (
            <FormListRow
              key={form.id}
              form={form}
              onNavigate={() => navigate(`/forms/${form.id}`)}
              onPreview={() => window.open(buildPreviewUrl(form.slug), "_blank")}
              onTogglePublish={() => handleTogglePublish(form)}
              onDelete={() => handleDelete(form)}
            />
          ))}
        </ul>
      )}

      <CreateFormModal
        open={createModalOpen}
        onClose={() => !creating && setCreateModalOpen(false)}
        onCreate={handleCreate}
        creating={creating}
        error={createError}
      />
    </div>
  );
}

function FormListRow({
  form,
  onNavigate,
  onPreview,
  onTogglePublish,
  onDelete,
}: {
  form: LocationRow;
  onNavigate: () => void;
  onPreview: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const updated = form.updated_at ?? form.created_at;

  return (
    <li
      onClick={onNavigate}
      className={`group relative flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md ${
        menuOpen ? "z-50" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <FormLogoAvatar name={form.name} logoUrl={form.theme?.logoUrl} />
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="truncate font-semibold text-zinc-900">{form.name}</span>
            <StatusBadge published={form.published} />
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 5.5l3 3L9 18l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edited {updated ? formatRelative(updated) : "—"}
          </div>
        </div>
      </div>
      <RowMenu
        form={form}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onEdit={onNavigate}
        onPreview={onPreview}
        onTogglePublish={onTogglePublish}
        onDelete={onDelete}
      />
    </li>
  );
}

function RowMenu({
  form,
  open,
  onOpenChange,
  onEdit,
  onPreview,
  onTogglePublish,
  onDelete,
}: {
  form: LocationRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onPreview: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onOpenChange]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenChange(!open);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
        aria-label="Actions"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="10" cy="16" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg ring-1 ring-black/5">
          <MenuButton
            icon={<EyeIcon />}
            onClick={() => {
              onOpenChange(false);
              onPreview();
            }}
          >
            Preview
          </MenuButton>
          <MenuButton
            icon={<PencilIcon />}
            onClick={() => {
              onOpenChange(false);
              onEdit();
            }}
          >
            Edit
          </MenuButton>
          <MenuButton
            icon={form.published ? <EyeOffIcon /> : <UpIcon />}
            onClick={() => {
              onOpenChange(false);
              onTogglePublish();
            }}
          >
            {form.published ? "Unpublish" : "Publish"}
          </MenuButton>
          <div className="my-1 border-t border-zinc-100" />
          <MenuButton
            icon={<TrashIcon />}
            onClick={() => {
              onOpenChange(false);
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
  icon,
  onClick,
  destructive,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
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
      className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors ${
        destructive ? "text-red-600 hover:bg-red-50" : "text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      <span className={destructive ? "text-red-500" : "text-zinc-400"}>{icon}</span>
      {children}
    </button>
  );
}

function StatusBadge({ published }: { published: boolean }) {
  return published ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 ring-1 ring-inset ring-zinc-500/20">
      <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
      Draft
    </span>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const day = 86_400_000;
  if (diff < day) return "today";
  if (diff < 2 * day) return "yesterday";
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function FormLogoAvatar({ name, logoUrl }: { name: string; logoUrl?: string }) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-zinc-200"
      />
    );
  }

  return (
    <div
      aria-hidden
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-500 ring-1 ring-zinc-200"
    >
      {initial}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 5.5l3 3L9 18l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function UpIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-5 5m5-5l5 5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3l18 18M10.5 10.6a2.5 2.5 0 003.5 3.5M9.9 5.7A10.4 10.4 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a16.5 16.5 0 01-3.2 3.8M6.1 6.1C3.9 7.8 2.5 12 2.5 12S6 18.5 12 18.5c1.1 0 2.1-.2 3-.5"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0v12a1 1 0 001 1h6a1 1 0 001-1V7" />
    </svg>
  );
}
