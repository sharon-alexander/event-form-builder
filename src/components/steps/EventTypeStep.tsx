import type { FormData, EventBookingType } from "../../types";
import FormStep from "../FormStep";

interface Props {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  onNext: () => void;
}

const BOOKING_TYPES: { value: EventBookingType; label: string; desc: string }[] = [
  {
    value: "private_event",
    label: "Private Event",
    desc: "An intimate gathering or celebration",
  },
  {
    value: "large_party",
    label: "Large Party Booking",
    desc: "A bigger group or multi-room event",
  },
];

export default function EventTypeStep({ data, onChange, onNext }: Props) {
  return (
    <FormStep
      title="Let's start planning your event"
      subtitle="What type of booking are you looking for, and how many guests?"
      onNext={onNext}
      nextDisabled={!data.bookingType || !data.guestCount}
    >
      <div className="space-y-6">
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

        <div>
          <label htmlFor="guest-count" className="efb-label">
            Estimated Headcount
          </label>
          <input
            id="guest-count"
            type="number"
            min={1}
            max={1000}
            placeholder="Number of guests"
            value={data.guestCount ?? ""}
            onChange={(e) =>
              onChange({
                guestCount: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="efb-input max-w-xs"
          />

          <label className="mt-3 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={data.headcountMayChange}
              onChange={(e) => onChange({ headcountMayChange: e.target.checked })}
              className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-gray-700">
              My headcount may change
            </span>
          </label>
        </div>
      </div>
    </FormStep>
  );
}
