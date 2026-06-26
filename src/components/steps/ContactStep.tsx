import FormStep from "../FormStep";
import type { StepProps } from "./stepProps";

export default function ContactStep({
  data,
  onChange,
  onNext,
  onBack,
  nextLabel = "Review & Submit",
  moreDetails,
  title = "Your details",
  subtitle = "Tell us a bit about yourself so we can get in touch.",
}: StepProps) {
  const isValid =
    data.firstName.trim() !== "" &&
    data.lastName.trim() !== "" &&
    data.email.trim() !== "" &&
    data.phone.trim() !== "";

  return (
    <FormStep
      title={title}
      subtitle={subtitle}
      moreDetails={moreDetails}
      onNext={onNext}
      onBack={onBack}
      nextLabel={nextLabel}
      nextDisabled={!isValid}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="first-name" className="efb-label">First Name *</label>
            <input
              id="first-name"
              type="text"
              value={data.firstName}
              onChange={(e) => onChange({ firstName: e.target.value })}
              className="efb-input"
              placeholder="First name"
            />
          </div>
          <div>
            <label htmlFor="last-name" className="efb-label">Last Name *</label>
            <input
              id="last-name"
              type="text"
              value={data.lastName}
              onChange={(e) => onChange({ lastName: e.target.value })}
              className="efb-input"
              placeholder="Last name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className="efb-label">Email *</label>
            <input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => onChange({ email: e.target.value })}
              className="efb-input"
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label htmlFor="phone" className="efb-label">Phone *</label>
            <input
              id="phone"
              type="tel"
              value={data.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              className="efb-input"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <div>
          <label htmlFor="company" className="efb-label">
            Company <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="company"
            type="text"
            value={data.company}
            onChange={(e) => onChange({ company: e.target.value })}
            className="efb-input max-w-md"
            placeholder="Company name"
          />
        </div>

        <div>
          <label htmlFor="site-visit" className="efb-label">
            Preferred Site Visit Dates <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="site-visit"
            type="text"
            value={data.preferredSiteVisitDates}
            onChange={(e) => onChange({ preferredSiteVisitDates: e.target.value })}
            className="efb-input max-w-md"
            placeholder="e.g. June 5–10, any weekday afternoon"
          />
        </div>

        <div>
          <label htmlFor="notes" className="efb-label">
            Additional Notes <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="notes"
            rows={3}
            value={data.additionalNotes}
            onChange={(e) => onChange({ additionalNotes: e.target.value })}
            className="efb-input"
            placeholder="Anything else we should know?"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={data.submittingOnBehalf}
            onChange={(e) => onChange({ submittingOnBehalf: e.target.checked })}
            className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm font-medium text-gray-700">
            I'm submitting on behalf of a client
          </span>
        </label>
      </div>
    </FormStep>
  );
}
