import type { FormData } from "../../types";
import FormStep from "../FormStep";

interface Props {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const TIME_OPTIONS: string[] = [];
for (let h = 9; h <= 23; h++) {
  for (const m of ["00", "30"]) {
    const suffix = h >= 12 ? "PM" : "AM";
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
    TIME_OPTIONS.push(`${display}:${m} ${suffix}`);
  }
}

export default function TimingStep({ data, onChange, onNext, onBack }: Props) {
  const isValid = data.timingFlexible || (data.startTime !== "" && data.endTime !== "");

  return (
    <FormStep
      title="What time works best?"
      subtitle="Select your preferred start and end times."
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!isValid}
    >
      <div className="space-y-5">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={data.timingFlexible}
            onChange={(e) => onChange({ timingFlexible: e.target.checked })}
            className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm font-medium text-gray-700">
            My timing is flexible
          </span>
        </label>

        {!data.timingFlexible && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="start-time" className="efb-label">Start Time</label>
              <select
                id="start-time"
                value={data.startTime}
                onChange={(e) => onChange({ startTime: e.target.value })}
                className="efb-input"
              >
                <option value="">Select start time</option>
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="end-time" className="efb-label">End Time</label>
              <select
                id="end-time"
                value={data.endTime}
                onChange={(e) => onChange({ endTime: e.target.value })}
                className="efb-input"
              >
                <option value="">Select end time</option>
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </FormStep>
  );
}
