import { MEAL_SERVICE_OPTIONS } from "../../types";
import { useLocationConfig } from "../../context/LocationContext";
import {
  evaluateRules,
  isMealServiceDisabled,
  isOptionHidden,
  mealServiceDayNote,
} from "../../form/conditions";
import { DEFAULT_STEP_COPY } from "../../form/defaultStepCopy";
import { isFieldRequired, isStepValid } from "../../form/fieldCatalog";
import {
  endTimeOptions,
  mealStartOptions,
  resolveTimingSlots,
} from "../../form/timingHours";
import RequiredMark from "../../form/RequiredMark";
import FormStep from "../FormStep";
import type { StepProps } from "./stepProps";

const copy = DEFAULT_STEP_COPY.timing;

const CLOSED_MESSAGE =
  "This venue is closed that day. Choose another date.";

function StandardTiming({
  data,
  onChange,
  required,
  slots,
  closed,
}: Pick<StepProps, "data" | "onChange"> & {
  required: boolean;
  slots: string[];
  closed: boolean;
}) {
  if (closed) {
    return <p className="text-sm text-gray-500">{CLOSED_MESSAGE}</p>;
  }
  const ends = endTimeOptions(slots, data.startTime);
  return (
    <>
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
              {slots.map((t) => (
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
              {ends.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </>
  );
}

function MealServiceTiming({
  data,
  onChange,
  required,
}: Pick<StepProps, "data" | "onChange"> & { required: boolean }) {
  const location = useLocationConfig();
  const evaluation = evaluateRules(location.formRules, data);
  const options = MEAL_SERVICE_OPTIONS.filter(
    (option) => !isOptionHidden(evaluation, "mealService", option.value),
  ).map((option) => {
    const times = mealStartOptions(option.value, location.timingHours, data);
    return {
      ...option,
      note: mealServiceDayNote(location.formRules, option.value),
      disabled:
        isMealServiceDisabled(evaluation, option.value) ||
        (!!location.timingHours && times.length === 0),
    };
  });
  const allDisabled = options.every((option) => option.disabled);
  const selected = options.find((option) => option.value === data.mealService);
  const timeOptions = selected
    ? mealStartOptions(selected.value, location.timingHours, data)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <p className="efb-label">
          Meal Service
          <RequiredMark required={required} />
        </p>
        {options.length === 0 || allDisabled ? (
          <p className="mb-3 text-sm text-gray-500">
            No meal services match these event details. Go back and adjust your answers.
          </p>
        ) : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {options.map((option) => {
            const chosen = selected?.value === option.value && !option.disabled;
            return (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                aria-disabled={option.disabled}
                onClick={() =>
                  onChange({
                    mealService: option.value,
                    startTime: "",
                    endTime: "",
                    timingFlexible: false,
                  })
                }
                className={`efb-card ${chosen ? "efb-card-selected" : ""} ${
                  option.disabled ? "cursor-not-allowed opacity-50" : ""
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
      </div>
      {selected && !selected.disabled && (
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
  const resolved = resolveTimingSlots(location.timingHours, props.data);
  const showCheckboxes =
    !isMeal || location.showAdditionalLoadInOut || location.showFullDayRental;

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
            slots={resolved.slots}
            closed={resolved.closed}
          />
        )}
        {showCheckboxes && (
          <div className="space-y-3">
            {!isMeal && !resolved.closed && (
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={props.data.timingFlexible}
                  onChange={(e) =>
                    props.onChange({ timingFlexible: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  My timing is flexible
                </span>
              </label>
            )}
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
