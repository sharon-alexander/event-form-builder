import type { FormData } from "../../types";
import { BUDGET_OPTIONS } from "../../types";
import FormStep from "../FormStep";

interface Props {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function BudgetStep({ data, onChange, onNext, onBack }: Props) {
  return (
    <FormStep
      title="What's your budget?"
      subtitle="Select the range that best fits your event."
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!data.budget}
    >
      <div className="grid grid-cols-2 gap-4">
        {BUDGET_OPTIONS.map((b) => (
          <button
            key={b.value}
            type="button"
            onClick={() => onChange({ budget: b.value })}
            className={`efb-card ${data.budget === b.value ? "efb-card-selected" : ""}`}
          >
            {b.label}
          </button>
        ))}
      </div>
    </FormStep>
  );
}
