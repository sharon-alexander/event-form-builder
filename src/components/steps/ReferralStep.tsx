import type { FormData } from "../../types";
import { REFERRAL_SOURCES } from "../../types";
import FormStep from "../FormStep";

interface Props {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ReferralStep({ data, onChange, onNext, onBack }: Props) {
  return (
    <FormStep
      title="How'd you hear about us?"
      onNext={onNext}
      onBack={onBack}
      nextDisabled={
        !data.referralSource ||
        (data.referralSource === "other" && !data.referralSourceOther.trim())
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {REFERRAL_SOURCES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => {
                onChange({ referralSource: r.value });
                if (r.value !== "other") onChange({ referralSourceOther: "" });
              }}
              className={`efb-card ${data.referralSource === r.value ? "efb-card-selected" : ""}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {data.referralSource === "other" && (
          <div>
            <label htmlFor="referral-other" className="efb-label">
              Please specify
            </label>
            <input
              id="referral-other"
              type="text"
              placeholder="How did you find us?"
              value={data.referralSourceOther}
              onChange={(e) => onChange({ referralSourceOther: e.target.value })}
              className="efb-input max-w-md"
            />
          </div>
        )}
      </div>
    </FormStep>
  );
}
