import type { InfoPageConfig } from "../../../locations/types";
import type { EditableLocation } from "../../pages/FormEditorPage";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
}

function emptyPage(): InfoPageConfig {
  return { title: "" };
}

export default function InfoPageEditor({ draft, update }: Props) {
  const page = draft.info_page ?? emptyPage();

  return (
    <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">Step title</h3>
        <p className="mt-0.5 text-xs text-zinc-400">
          Heading on the form. People must tap “I Understand” to continue.
        </p>
      </div>

      <input
        id="info-title"
        className="adm-input"
        placeholder="e.g. Food & Beverage Service"
        value={page.title}
        onChange={(e) => update({ info_page: { title: e.target.value } })}
      />
    </section>
  );
}
