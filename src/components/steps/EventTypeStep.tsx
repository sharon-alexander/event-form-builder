import type { EventBookingType } from "../../types";
import FormStep from "../FormStep";
import type { StepProps } from "./stepProps";

const BOOKING_TYPES: { value: EventBookingType; label: string; desc: string }[] = [
  { value: "private_event", label: "Private Event", desc: "An intimate gathering or celebration" },
  { value: "large_party", label: "Large Party Booking", desc: "A bigger group or multi-room event" },
];

export default function EventTypeStep({
  data,
  onChange,
  onNext,
  onBack,
  nextLabel,
  moreDetails,
  title = "What type of event?",
  subtitle = "Select the booking type that best fits your plans.",
}: StepProps) {
  return (
    <FormStep
      title={title}
      subtitle={subtitle}
      moreDetails={moreDetails}
      onNext={onNext}
      onBack={onBack}
      nextLabel={nextLabel}
      nextDisabled={!data.bookingType}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {BOOKING_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange({ bookingType: t.value })}
            className={`efb-card text-left ${data.bookingType === t.value ? "efb-card-selected" : ""}`}
          >
            <div className="font-semibold text-gray-900">{t.label}</div>
            <div className="mt-1 text-sm text-gray-500">{t.desc}</div>
          </button>
        ))}
      </div>
    </FormStep>
  );
}
