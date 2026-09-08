import { REFERRAL_SOURCES } from "../../types";
import { useLocationConfig } from "../../context/LocationContext";
import { DEFAULT_STEP_COPY } from "../../form/defaultStepCopy";
import { isFieldRequired, isStepValid } from "../../form/fieldCatalog";
import RequiredMark from "../../form/RequiredMark";
import FormStep from "../FormStep";
import type { StepProps } from "./stepProps";

const copy = DEFAULT_STEP_COPY.other_venues_referral;

export default function OtherVenuesReferralStep({
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
  const detailsRequired = isFieldRequired(location, "otherVenuesDetails");

  return (
    <FormStep
      title={title}
      subtitle={subtitle}
      moreDetails={moreDetails}
      onNext={onNext}
      onBack={onBack}
      nextLabel={nextLabel}
      nextDisabled={!isStepValid("other_venues_referral", data, location)}
    >
      <div className="space-y-8">
        <div>
          <p className="efb-label">
            Considering any other venues?
            <RequiredMark required={isFieldRequired(location, "consideringOtherVenues")} />
          </p>
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
            <>
              <label htmlFor="other-venues-details" className="efb-label mt-3">
                Which venues are you considering?
                <RequiredMark required={detailsRequired} />
              </label>
              <textarea
                id="other-venues-details"
                className="efb-input"
                rows={2}
                placeholder="Which venues are you considering?"
                value={data.otherVenuesDetails}
                onChange={(e) => onChange({ otherVenuesDetails: e.target.value })}
              />
            </>
          )}
        </div>

        <div>
          <p className="efb-label">
            How did you hear about us?
            <RequiredMark required={isFieldRequired(location, "referralSource")} />
          </p>
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
