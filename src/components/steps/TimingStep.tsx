import {
  MEAL_SERVICE_OPTIONS,
  LUNCH_START_TIMES,
  DINNER_START_TIMES,
} from "../../types";
import { useLocationConfig } from "../../context/LocationContext";
import { DEFAULT_STEP_COPY } from "../../form/defaultStepCopy";
import { isFieldRequired, isStepValid } from "../../form/fieldCatalog";
import RequiredMark from "../../form/RequiredMark";
import FormStep from "../FormStep";
import type { StepProps } from "./stepProps";

const copy = DEFAULT_STEP_COPY.timing;

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

function StandardTiming({
  data,
  onChange,
  required,
}: Pick<StepProps, "data" | "onChange"> & { required: boolean }) {
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
            <label htmlFor="start-time" className="efb-label">
              Start Time
              <RequiredMark required={required} />
            </label>
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
            <label htmlFor="end-time" className="efb-label">
              End Time
              <RequiredMark required={required} />
            </label>
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

function MealServiceTiming({
  data,
  onChange,
  required,
}: Pick<StepProps, "data" | "onChange"> & { required: boolean }) {
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
        <p className="efb-label">
          Meal Service
          <RequiredMark required={required} />
        </p>
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
          <label htmlFor="meal-start-time" className="efb-label">
            Start Time
            <RequiredMark required={required} />
          </label>
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
  const location = useLocationConfig();
  const isMeal = location.timingStyle === "meal_service";
  const required = isFieldRequired(location, "timing");

  return (
    <FormStep
      title={props.title ?? copy.title}
      subtitle={
        props.subtitle ??
        (isMeal
          ? "Select your meal service and preferred start time."
          : copy.subtitle)
      }
      moreDetails={props.moreDetails}
      onNext={props.onNext}
      onBack={props.onBack}
      nextLabel={props.nextLabel}
      nextDisabled={!isStepValid("timing", props.data, location)}
    >
      <div className="space-y-5">
        {isMeal ? (
          <MealServiceTiming
            data={props.data}
            onChange={props.onChange}
            required={required}
          />
        ) : (
          <StandardTiming
            data={props.data}
            onChange={props.onChange}
            required={required}
          />
        )}
        {(location.showAdditionalLoadInOut || location.showFullDayRental) && (
          <div className="space-y-3">
            {location.showAdditionalLoadInOut && (
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={props.data.additionalLoadInOutNeeded}
                  onChange={(e) =>
                    props.onChange({
                      additionalLoadInOutNeeded: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Additional load in/out time needed
                </span>
              </label>
            )}
            {location.showFullDayRental && (
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={props.data.interestedInFullDayRental}
                  onChange={(e) =>
                    props.onChange({
                      interestedInFullDayRental: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  I'm also interested in a full-day rental
                </span>
              </label>
            )}
          </div>
        )}
      </div>
    </FormStep>
  );
}
