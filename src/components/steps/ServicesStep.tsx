import type { ServiceInterest } from "../../types";
import { SERVICE_OPTIONS } from "../../types";
import FormStep from "../FormStep";
import type { StepProps } from "./stepProps";

export default function ServicesStep({
  data,
  onChange,
  onNext,
  onBack,
  nextLabel,
  moreDetails,
  title = "I am interested in…",
  subtitle = "Select all that apply — or skip if none.",
}: StepProps) {
  const toggle = (value: ServiceInterest) => {
    const next = data.services.includes(value)
      ? data.services.filter((s) => s !== value)
      : [...data.services, value];
    onChange({ services: next });
  };

  return (
    <FormStep
      title={title}
      subtitle={subtitle}
      moreDetails={moreDetails}
      onNext={onNext}
      onBack={onBack}
      nextLabel={nextLabel}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SERVICE_OPTIONS.map((option) => {
          const selected = data.services.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              className={`efb-card flex items-center gap-3 text-left ${selected ? "efb-card-selected" : ""}`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                  selected ? "border-brand-500 bg-brand-500 text-white" : "border-gray-300"
                }`}
              >
                {selected && (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className="font-medium text-gray-900">{option.label}</span>
            </button>
          );
        })}
      </div>
    </FormStep>
  );
}
