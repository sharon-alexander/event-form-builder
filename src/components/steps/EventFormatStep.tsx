import { EVENT_CATEGORIES, EVENT_FORMATS } from "../../types";
import { useLocationConfig } from "../../context/LocationContext";
import { DEFAULT_STEP_COPY } from "../../form/defaultStepCopy";
import { isFieldRequired, isStepValid } from "../../form/fieldCatalog";
import RequiredMark from "../../form/RequiredMark";
import FormStep from "../FormStep";
import SearchableCombobox from "../SearchableCombobox";
import type { StepProps } from "./stepProps";

const copy = DEFAULT_STEP_COPY.event_format;

export default function EventFormatStep({
  data,
  onChange,
  onNext,
  onBack,
  nextLabel,
  moreDetails,
  title = copy.title,
  subtitle = copy.subtitle,
}: StepProps) {
  const location = useLocationConfig();
  const categories = location.eventCategories ?? EVENT_CATEGORIES;
  const formats = location.eventFormats ?? EVENT_FORMATS;

  return (
    <FormStep
      title={title}
      subtitle={subtitle}
      moreDetails={moreDetails}
      onNext={onNext}
      onBack={onBack}
      nextLabel={nextLabel}
      nextDisabled={!isStepValid("event_format", data, location)}
    >
      <div className="space-y-6">
        <div>
          <label htmlFor="event-category" className="efb-label">
            Event Type
            <RequiredMark required={isFieldRequired(location, "eventCategory")} />
          </label>
          <SearchableCombobox
            id="event-category"
            value={data.eventCategory}
            options={categories}
            placeholder="Search event types"
            onChange={(eventCategory) =>
              onChange({
                eventCategory,
                eventCategoryOther: eventCategory === "other" ? data.eventCategoryOther : "",
              })
            }
          />
          {data.eventCategory === "other" && (
            <input
              className="efb-input mt-3"
              placeholder="Please describe"
              value={data.eventCategoryOther}
              onChange={(e) => onChange({ eventCategoryOther: e.target.value })}
            />
          )}
        </div>
        <div>
          <p className="efb-label">
            Format
            <RequiredMark required={isFieldRequired(location, "eventFormat")} />
          </p>
          <div className="grid grid-cols-2 gap-3">
            {formats.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => onChange({ eventFormat: f.value })}
                className={`efb-card ${data.eventFormat === f.value ? "efb-card-selected" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </FormStep>
  );
}
