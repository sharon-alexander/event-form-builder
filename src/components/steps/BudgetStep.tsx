import { useLocationConfig } from "../../context/LocationContext";
import { DEFAULT_STEP_COPY } from "../../form/defaultStepCopy";
import FormStep from "../FormStep";
import type { StepProps } from "./stepProps";

const copy = DEFAULT_STEP_COPY.budget;

export default function BudgetStep({
  data,
  onChange,
  onNext,
  onBack,
  nextLabel,
  moreDetails,
  title = copy.title,
  subtitle = copy.subtitle,
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
