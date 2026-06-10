import type { FormData } from "../../types";
import { VENUE_SPACES } from "../../types";
import FormStep from "../FormStep";

interface Props {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function VenueSpaceStep({ data, onChange, onNext, onBack }: Props) {
  return (
    <FormStep
      title="Where would you like to host?"
      subtitle="Each space has its own character and capacity."
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!data.venueSpace}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {VENUE_SPACES.map((v) => (
          <button
            key={v.value}
            type="button"
            onClick={() => onChange({ venueSpace: v.value })}
            className={`efb-card text-left ${data.venueSpace === v.value ? "efb-card-selected" : ""}`}
          >
            <div className="font-semibold text-gray-900">{v.label}</div>
            <div className="mt-1 text-xs text-brand-600">{v.price}</div>
          </button>
        ))}
      </div>
    </FormStep>
  );
}
