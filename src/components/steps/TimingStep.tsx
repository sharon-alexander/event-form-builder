import {
  MEAL_SERVICE_OPTIONS,
  LUNCH_START_TIMES,
  DINNER_START_TIMES,
} from "../../types";
import { useLocationConfig } from "../../context/LocationContext";
import FormStep from "../FormStep";
import type { StepProps } from "./stepProps";

const TIME_OPTIONS: string[] = [];
for (let h = 9; h <= 23; h++) {
  for (const m of ["00", "30"]) {
    const suffix = h >= 12 ? "PM" : "AM";
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
    TIME_OPTIONS.push(`${display}:${m} ${suffix}`);
  }
}

function isLunchAvailable(data: StepProps["data"]): boolean {
  if (data.datesFlexible || !data.eventDate) return true;
  const day = new Date(data.eventDate + "T00:00:00").getDay();
  return day === 0 || day === 5 || day === 6;
}

function StandardTiming({ data, onChange }: Pick<StepProps, "data" | "onChange">) {
  return (
    <div className="space-y-5">
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={data.timingFlexible}
          onChange={(e) => onChange({ timingFlexible: e.target.checked })}
          className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-sm font-medium text-gray-700">My timing is flexible</span>
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
  );
}

function MealServiceTiming({ data, onChange }: Pick<StepProps, "data" | "onChange">) {
  const lunchAvailable = isLunchAvailable(data);
  const timeOptions =
    data.mealService === "lunch"
      ? LUNCH_START_TIMES
      : data.mealService === "dinner"
        ? DINNER_START_TIMES
        : [];

  return (
    <div className="space-y-6">
      <div>
        <p className="efb-label">Meal Service</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {MEAL_SERVICE_OPTIONS.map((option) => {
            const disabled = option.value === "lunch" && !lunchAvailable;
            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange({
                    mealService: option.value,
                    startTime: "",
                    endTime: "",
                    timingFlexible: false,
                  })
                }
                className={`efb-card ${data.mealService === option.value ? "efb-card-selected" : ""} ${
                  disabled ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                <span className="block font-medium">{option.label}</span>
                {option.note && (
                  <span className="mt-1 block text-xs text-gray-500">{option.note}</span>
                )}
              </button>
            );
          })}
        </div>
        {!lunchAvailable && (
          <p className="mt-2 text-xs text-gray-500">
            Lunch is available Friday through Sunday. Your selected date falls on a weekday.
          </p>
        )}
      </div>
      {data.mealService && (
        <div>
          <label htmlFor="meal-start-time" className="efb-label">Start Time</label>
          <select
            id="meal-start-time"
            value={data.startTime}
            onChange={(e) => onChange({ startTime: e.target.value })}
            className="efb-input"
          >
            <option value="">Select start time</option>
            {timeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export default function TimingStep(props: StepProps) {
  const { timingStyle } = useLocationConfig();
  const isMeal = timingStyle === "meal_service";

  const isValid = isMeal
    ? props.data.mealService !== null && props.data.startTime !== ""
    : props.data.timingFlexible || (props.data.startTime !== "" && props.data.endTime !== "");

  return (
    <FormStep
      title={props.title ?? "Timing"}
      subtitle={
        props.subtitle ??
        (isMeal
          ? "Select your meal service and preferred start time."
          : "Select your preferred start and end times.")
      }
      moreDetails={props.moreDetails}
      onNext={props.onNext}
      onBack={props.onBack}
      nextLabel={props.nextLabel}
      nextDisabled={!isValid}
    >
      {isMeal ? (
        <MealServiceTiming data={props.data} onChange={props.onChange} />
      ) : (
        <StandardTiming data={props.data} onChange={props.onChange} />
      )}
    </FormStep>
  );
}
