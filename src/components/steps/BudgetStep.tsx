import { useLocationConfig } from "../../context/LocationContext";
import FormStep from "../FormStep";
import type { StepProps } from "./stepProps";

export default function BudgetStep({
  data,
  onChange,
  onNext,
  onBack,
  nextLabel,
  moreDetails,
  title = "What's your budget?",
  subtitle = "This helps us recommend the right experience.",
}: StepProps) {
  const { budgetOptions } = useLocationConfig();

  return (
    <FormStep
      title={title}
      subtitle={subtitle}
      moreDetails={moreDetails}
      onNext={onNext}
      onBack={onBack}
      nextLabel={nextLabel}
      nextDisabled={!data.budget}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {budgetOptions.map((b) => (
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
