import type { FormData, EventCategory } from "../../types";
import { EVENT_CATEGORIES } from "../../types";
import FormStep from "../FormStep";

interface Props {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function EventCategoryStep({ data, onChange, onNext, onBack }: Props) {
  const handleSelect = (value: EventCategory) => {
    onChange({ eventCategory: value });
    if (value !== "other") onChange({ eventCategoryOther: "" });
  };

  return (
    <FormStep
      title="What's the occasion?"
      subtitle="Select the type of event you're planning."
      onNext={onNext}
      onBack={onBack}
      nextDisabled={
        !data.eventCategory ||
        (data.eventCategory === "other" && !data.eventCategoryOther.trim())
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {EVENT_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => handleSelect(cat.value)}
              className={`efb-card ${data.eventCategory === cat.value ? "efb-card-selected" : ""}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {data.eventCategory === "other" && (
          <div>
            <label htmlFor="event-cat-other" className="efb-label">
              Please describe
            </label>
            <input
              id="event-cat-other"
              type="text"
              placeholder="What kind of event?"
              value={data.eventCategoryOther}
              onChange={(e) => onChange({ eventCategoryOther: e.target.value })}
              className="efb-input max-w-md"
            />
          </div>
        )}
      </div>
    </FormStep>
  );
}
