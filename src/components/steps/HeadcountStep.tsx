import FormStep from "../FormStep";
import type { StepProps } from "./stepProps";

export default function HeadcountStep({
  data,
  onChange,
  onNext,
  onBack,
  nextLabel,
  moreDetails,
  title = "How many guests?",
  subtitle = "An estimate is fine — you can let us know if it may change.",
}: StepProps) {
  return (
    <FormStep
      title={title}
      subtitle={subtitle}
      moreDetails={moreDetails}
      onNext={onNext}
      onBack={onBack}
      nextLabel={nextLabel}
      nextDisabled={!data.guestCount}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="guest-count" className="efb-label">Estimated Headcount</label>
          <input
            id="guest-count"
            type="number"
            min={1}
            max={1000}
            placeholder="Number of guests"
            value={data.guestCount ?? ""}
            onChange={(e) =>
              onChange({ guestCount: e.target.value ? Number(e.target.value) : null })
            }
            className="efb-input max-w-xs"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={data.headcountMayChange}
            onChange={(e) => onChange({ headcountMayChange: e.target.checked })}
            className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm font-medium text-gray-700">My headcount may change</span>
        </label>
      </div>
    </FormStep>
  );
}
