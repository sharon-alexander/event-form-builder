import type { FormData } from "../../types";
import { EVENT_FORMATS } from "../../types";
import FormStep from "../FormStep";

interface Props {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function EventFormatStep({ data, onChange, onNext, onBack }: Props) {
  return (
    <FormStep
      title="What format works best?"
      subtitle="How would you like the event set up?"
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!data.eventFormat}
    >
      <div className="grid grid-cols-2 gap-4">
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
    </FormStep>
  );
}
