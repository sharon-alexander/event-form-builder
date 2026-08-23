import type { EditableLocation } from "../../pages/FormEditorPage";
import ContentTab from "./ContentTab";
import GalleryTab from "./GalleryTab";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
  orgId: string | null;
  onError: (msg: string) => void;
}

export default function LandingTab({ draft, update, orgId, onError }: Props) {
  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900">Landing page</h2>
        <p className="mt-0.5 text-xs text-zinc-400">
          Shown before the form starts — venue name, about copy, and hero gallery.
        </p>
      </div>

      <section className="space-y-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Content
        </h3>
        <ContentTab draft={draft} update={update} />
      </section>

      <hr className="border-zinc-100" />

      <section>
        <GalleryTab draft={draft} update={update} orgId={orgId} onError={onError} />
      </section>
    </div>
  );
}
