import type { FormData, ServiceInterest } from "../../types";
import { SERVICE_OPTIONS } from "../../types";
import FormStep from "../FormStep";

interface Props {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ServicesStep({ data, onChange, onNext, onBack }: Props) {
  const toggle = (val: ServiceInterest) => {
    const next = data.services.includes(val)
      ? data.services.filter((s) => s !== val)
      : [...data.services, val];
    onChange({ services: next });
  };

  return (
    <FormStep
      title="I'm interested in…"
      subtitle="Select all the services you'd like to explore."
      onNext={onNext}
      onBack={onBack}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SERVICE_OPTIONS.map((s) => {
          const selected = data.services.includes(s.value);
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => toggle(s.value)}
              className={`efb-card flex items-center gap-3 text-left ${selected ? "efb-card-selected" : ""}`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                  selected
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-gray-300"
                }`}
              >
                {selected && (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className="text-sm font-medium text-gray-900">{s.label}</span>
            </button>
          );
        })}
      </div>
    </FormStep>
  );
}
