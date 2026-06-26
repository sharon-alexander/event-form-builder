import { useLocationConfig } from "../../context/LocationContext";
import FormStep from "../FormStep";
import type { StepProps } from "./stepProps";

export default function InfoAcknowledgeStep({
  data,
  onChange,
  onNext,
  onBack,
  nextLabel,
  moreDetails,
}: StepProps) {
  const { infoPage } = useLocationConfig();
  const title = infoPage?.title ?? "Please review";

  return (
    <FormStep
      title={title}
      moreDetails={moreDetails}
      onNext={onNext}
      onBack={onBack}
      nextLabel={nextLabel}
      nextDisabled={!data.infoAcknowledged}
    >
      <div className="space-y-8">
        <button
          type="button"
          onClick={() => onChange({ infoAcknowledged: !data.infoAcknowledged })}
          className={`w-full rounded-lg border-2 px-6 py-4 text-sm font-semibold uppercase tracking-wide transition-all ${
            data.infoAcknowledged
              ? "border-brand-600 bg-brand-50 text-brand-800"
              : "border-brand-700 bg-white text-brand-700 hover:bg-brand-50"
          }`}
        >
          I Understand
        </button>

        {(infoPage?.intro || infoPage?.sections?.length) && (
          <div className="space-y-4 border-t border-brand-100 pt-6">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-brand-800">
              More Details
            </h3>
            {infoPage?.intro && <p className="text-sm text-gray-600">{infoPage.intro}</p>}
            {infoPage?.sections?.map((section, i) => (
              <div key={i} className="space-y-1">
                {section.heading && (
                  <p className="text-sm font-semibold text-gray-900">{section.heading}</p>
                )}
                {section.body && <p className="text-sm text-gray-600">{section.body}</p>}
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
                    {section.bullets.map((bullet, j) => (
                      <li key={j}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </FormStep>
  );
}
