import { EVENT_CATEGORIES, EVENT_FORMATS } from "../../../types";
import type { EditableLocation } from "../../pages/FormEditorPage";
import ChoiceListEditor from "./ChoiceListEditor";
import { fieldIsRequired, setFieldRequired } from "./RequiredCheckbox";

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
        requiredChecked={fieldIsRequired(draft, "eventCategory")}
        onRequiredChange={(required) =>
          setFieldRequired(draft, update, "eventCategory", required)
        }
      />
      <ChoiceListEditor
        title="Formats"
        catalog={EVENT_FORMATS}
        selected={draft.event_formats ?? EVENT_FORMATS}
        onChange={(event_formats) => update({ event_formats })}
        requiredChecked={fieldIsRequired(draft, "eventFormat")}
        onRequiredChange={(required) =>
          setFieldRequired(draft, update, "eventFormat", required)
        }
      />
    </div>
  );
}
