import type { InfoPageConfig } from "../../../locations/types";
import type { EditableLocation } from "../../pages/FormEditorPage";
import { fieldIsRequired, RequiredCheckbox, setFieldRequired } from "./RequiredCheckbox";

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
          Heading on the form.
        </p>
      </div>

      <input
        id="info-title"
        className="adm-input"
        placeholder="e.g. Food & Beverage Service"
        value={page.title}
        onChange={(e) => update({ info_page: { title: e.target.value } })}
      />

      <div className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-3">
        <p className="text-sm font-medium text-zinc-900">I Understand</p>
        <RequiredCheckbox
          checked={fieldIsRequired(draft, "infoAcknowledged")}
          onChange={(required) =>
            setFieldRequired(draft, update, "infoAcknowledged", required)
          }
        />
      </div>
    </section>
  );
}
