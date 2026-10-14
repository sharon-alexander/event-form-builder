import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function UnsavedChangesDialog({
  open,
  saving,
  onStay,
  onDiscard,
  onSave,
}: {
  open: boolean;
  saving: boolean;
  onStay: () => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) onStay();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, saving, onStay]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
      aria-describedby="unsaved-changes-body"
    >
      <button
        type="button"
        aria-label="Stay on this page"
        className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
        onClick={onStay}
        disabled={saving}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl">
        <h2 id="unsaved-changes-title" className="text-base font-semibold text-zinc-900">
          Unsaved changes
        </h2>
        <p id="unsaved-changes-body" className="mt-2 text-sm text-zinc-600">
          This form has changes that are not saved yet. Save them before leaving, or discard them.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onStay}
            disabled={saving}
            className="adm-btn-secondary px-4 py-2"
          >
            Stay
          </button>
          <button
            type="button"
            onClick={onDiscard}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="adm-btn-primary px-4 py-2"
          >
            {saving ? "Saving…" : "Save and leave"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
