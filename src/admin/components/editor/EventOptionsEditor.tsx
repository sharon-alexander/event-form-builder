import { EVENT_CATEGORIES, EVENT_FORMATS } from "../../../types";
import type { EditableLocation } from "../../pages/FormEditorPage";
import ChoiceListEditor from "./ChoiceListEditor";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
}

export default function EventOptionsEditor({ draft, update }: Props) {
  return (
    <div className="space-y-6">
      <ChoiceListEditor
        title="Event types"
        hint="Other still asks them to describe."
        catalog={EVENT_CATEGORIES}
        selected={draft.event_categories ?? EVENT_CATEGORIES}
        onChange={(event_categories) => update({ event_categories })}
      />
      <ChoiceListEditor
        title="Formats"
        catalog={EVENT_FORMATS}
        selected={draft.event_formats ?? EVENT_FORMATS}
        onChange={(event_formats) => update({ event_formats })}
      />
    </div>
  );
}
