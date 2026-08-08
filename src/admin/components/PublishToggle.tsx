interface PublishToggleProps {
  published: boolean;
  onChange: (published: boolean) => void;
  disabled?: boolean;
}

export default function PublishToggle({
  published,
  onChange,
  disabled,
}: PublishToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={published}
      aria-label={published ? "Published — click to unpublish" : "Draft — click to publish"}
      disabled={disabled}
      onClick={() => onChange(!published)}
      className={`inline-flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        published
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-zinc-200 bg-white text-zinc-600"
      }`}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          published ? "bg-emerald-500" : "bg-zinc-300"
        }`}
        aria-hidden
      />
      <span>{published ? "Published" : "Draft"}</span>
      <span
        className={`relative ml-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
          published ? "bg-emerald-600" : "bg-zinc-300"
        }`}
        aria-hidden
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            published ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
