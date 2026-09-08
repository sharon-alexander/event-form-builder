import type { EventBookingType } from "../../types";
import { useLocationConfig } from "../../context/LocationContext";
import { DEFAULT_STEP_COPY } from "../../form/defaultStepCopy";
import { isFieldRequired, isStepValid } from "../../form/fieldCatalog";
import RequiredMark from "../../form/RequiredMark";
import FormStep from "../FormStep";
import type { StepProps } from "./stepProps";

const BOOKING_TYPES: { value: EventBookingType; label: string }[] = [
  { value: "private_event", label: "Private Event" },
  { value: "large_party", label: "Large Party Booking" },
];

const copy = DEFAULT_STEP_COPY.event_type;

export default function EventTypeStep({
  data,
  onChange,
  onNext,
  onBack,
  nextLabel,
  moreDetails,
  title = copy.title,
  subtitle = copy.subtitle,
}: StepProps) {
  const location = useLocationConfig();
  const required = isFieldRequired(location, "bookingType");

  return (
    <FormStep
      title={title}
      subtitle={subtitle}
      moreDetails={moreDetails}
      onNext={onNext}
      onBack={onBack}
      nextLabel={nextLabel}
      nextDisabled={!isStepValid("event_type", data, location)}
    >
      <p className="efb-label">
        Booking type
        <RequiredMark required={required} />
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {BOOKING_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange({ bookingType: t.value })}
            className={`efb-card text-left ${data.bookingType === t.value ? "efb-card-selected" : ""}`}
          >
            <div className="font-semibold text-gray-900">{t.label}</div>
          </button>
        ))}
      </div>
    </FormStep>
  );
}
