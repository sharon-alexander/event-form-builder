import type { FormData } from "../../types";
import { MONTHS, DAYS_OF_WEEK } from "../../types";
import FormStep from "../FormStep";

interface Props {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function EventDateStep({ data, onChange, onNext, onBack }: Props) {
  const toggleMonth = (m: string) => {
    const current = data.flexibleDatePreferences.preferredMonths;
    const next = current.includes(m) ? current.filter((x) => x !== m) : [...current, m];
    onChange({
      flexibleDatePreferences: { ...data.flexibleDatePreferences, preferredMonths: next },
    });
  };

  const toggleDay = (d: string) => {
    const current = data.flexibleDatePreferences.preferredDays;
    const next = current.includes(d) ? current.filter((x) => x !== d) : [...current, d];
    onChange({
      flexibleDatePreferences: { ...data.flexibleDatePreferences, preferredDays: next },
    });
  };

  const isValid = data.datesFlexible
    ? data.flexibleDatePreferences.preferredMonths.length > 0
    : data.eventDate !== "";

  return (
    <FormStep
      title="When are you thinking?"
      subtitle="Pick a date or let us know your flexibility."
      onNext={onNext}
      onBack={onBack}
      nextDisabled={!isValid}
    >
      <div className="space-y-5">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={data.datesFlexible}
            onChange={(e) => onChange({ datesFlexible: e.target.checked })}
            className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm font-medium text-gray-700">
            My dates are flexible
          </span>
        </label>

        {!data.datesFlexible ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="event-date" className="efb-label">Event Date</label>
              <input
                id="event-date"
                type="date"
                value={data.eventDate}
                onChange={(e) => onChange({ eventDate: e.target.value })}
                className="efb-input"
              />
            </div>
            <div>
              <label htmlFor="backup-date" className="efb-label">
                Backup Date <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="backup-date"
                type="date"
                value={data.backupDate}
                onChange={(e) => onChange({ backupDate: e.target.value })}
                className="efb-input"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="efb-label">Preferred Months</p>
              <div className="flex flex-wrap gap-2">
                {MONTHS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMonth(m)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      data.flexibleDatePreferences.preferredMonths.includes(m)
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-gray-200 text-gray-600 hover:border-brand-300"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="efb-label">Preferred Days</p>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      data.flexibleDatePreferences.preferredDays.includes(d)
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-gray-200 text-gray-600 hover:border-brand-300"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </FormStep>
  );
}
