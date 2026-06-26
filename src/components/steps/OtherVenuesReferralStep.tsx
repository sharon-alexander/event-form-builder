import { REFERRAL_SOURCES } from "../../types";
import FormStep from "../FormStep";
import type { StepProps } from "./stepProps";

export default function OtherVenuesReferralStep({
  data,
  onChange,
  onNext,
  onBack,
  nextLabel,
  moreDetails,
  title = "Almost there",
  subtitle = "A couple more questions before we wrap up.",
}: StepProps) {
  const referralValid =
    data.referralSource !== null &&
    (data.referralSource !== "other" || data.referralSourceOther.trim() !== "");

  const isValid = data.consideringOtherVenues !== null && referralValid;

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
      <div className="space-y-8">
        <div>
          <p className="efb-label">Considering any other venues?</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => onChange({ consideringOtherVenues: true })}
              className={`efb-card ${data.consideringOtherVenues === true ? "efb-card-selected" : ""}`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => onChange({ consideringOtherVenues: false, otherVenuesDetails: "" })}
              className={`efb-card ${data.consideringOtherVenues === false ? "efb-card-selected" : ""}`}
            >
              No
            </button>
          </div>
          {data.consideringOtherVenues && (
            <textarea
              className="efb-input mt-3"
              rows={2}
              placeholder="Which venues are you considering?"
              value={data.otherVenuesDetails}
              onChange={(e) => onChange({ otherVenuesDetails: e.target.value })}
            />
          )}
        </div>

        <div>
          <p className="efb-label">How did you hear about us?</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {REFERRAL_SOURCES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() =>
                  onChange({
                    referralSource: r.value,
                    referralSourceOther: r.value === "other" ? data.referralSourceOther : "",
                  })
                }
                className={`efb-card ${data.referralSource === r.value ? "efb-card-selected" : ""}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {data.referralSource === "other" && (
            <input
              className="efb-input mt-3"
              placeholder="Please specify"
              value={data.referralSourceOther}
              onChange={(e) => onChange({ referralSourceOther: e.target.value })}
            />
          )}
        </div>
      </div>
    </FormStep>
  );
}
