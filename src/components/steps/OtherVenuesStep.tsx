import type { FormData } from "../../types";
import FormStep from "../FormStep";

interface Props {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function OtherVenuesStep({ data, onChange, onNext, onBack }: Props) {
  const isValid =
    data.consideringOtherVenues === false ||
    (data.consideringOtherVenues === true && data.otherVenuesDetails.trim() !== "");

  return (
    <FormStep
      title="Considering any other venues?"
      subtitle="No wrong answer — this helps us understand your search."
      onNext={onNext}
      onBack={onBack}
      nextDisabled={data.consideringOtherVenues === null || !isValid}
    >
      <div className="space-y-4">
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
            onClick={() =>
              onChange({ consideringOtherVenues: false, otherVenuesDetails: "" })
            }
            className={`efb-card ${data.consideringOtherVenues === false ? "efb-card-selected" : ""}`}
          >
            No
          </button>
        </div>

        {data.consideringOtherVenues === true && (
          <div>
            <label htmlFor="other-venues" className="efb-label">
              Which venues are you considering?
            </label>
            <textarea
              id="other-venues"
              rows={3}
              placeholder="e.g. The Bowery Hotel, Public Hotel…"
              value={data.otherVenuesDetails}
              onChange={(e) => onChange({ otherVenuesDetails: e.target.value })}
              className="efb-input"
            />
          </div>
        )}
      </div>
    </FormStep>
  );
}
