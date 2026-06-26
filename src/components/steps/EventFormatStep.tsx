import { EVENT_CATEGORIES, EVENT_FORMATS } from "../../types";
import FormStep from "../FormStep";
import type { StepProps } from "./stepProps";

export default function EventFormatStep({
  data,
  onChange,
  onNext,
  onBack,
  nextLabel,
  moreDetails,
  title = "Type & format",
  subtitle = "Tell us about the occasion and how you'd like the event set up.",
}: StepProps) {
  const categoryValid =
    data.eventCategory !== null &&
    (data.eventCategory !== "other" || data.eventCategoryOther.trim() !== "");

  return (
    <FormStep
      title={title}
      subtitle={subtitle}
      moreDetails={moreDetails}
      onNext={onNext}
      onBack={onBack}
      nextLabel={nextLabel}
      nextDisabled={!categoryValid || !data.eventFormat}
    >
      <div className="space-y-6">
        <div>
          <p className="efb-label">Event Type</p>
          <div className="grid grid-cols-2 gap-3">
            {EVENT_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() =>
                  onChange({
                    eventCategory: cat.value,
                    eventCategoryOther: cat.value === "other" ? data.eventCategoryOther : "",
                  })
                }
                className={`efb-card ${data.eventCategory === cat.value ? "efb-card-selected" : ""}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
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
          <p className="efb-label">Format</p>
          <div className="grid grid-cols-2 gap-3">
            {EVENT_FORMATS.map((f) => (
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
