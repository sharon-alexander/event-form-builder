import { useLocationConfig } from "../../context/LocationContext";
import { DEFAULT_STEP_COPY } from "../../form/defaultStepCopy";
import { isFieldRequired, isStepValid } from "../../form/fieldCatalog";
import { toDisplayHtml } from "../../utils/richText";
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
  const location = useLocationConfig();
  const title = location.infoPage?.title ?? DEFAULT_STEP_COPY.info_acknowledge.title;
  const detailsHtml = moreDetails ? toDisplayHtml(moreDetails) : "";
  const required = isFieldRequired(location, "infoAcknowledged");

  return (
    <FormStep
      title={title}
      onNext={onNext}
      onBack={onBack}
      nextLabel={nextLabel}
      nextDisabled={!isStepValid("info_acknowledge", data, location)}
    >
      <div className="space-y-8">
        {detailsHtml ? (
          <div
            className="efb-rich-text text-sm text-gray-600"
            dangerouslySetInnerHTML={{ __html: detailsHtml }}
          />
        ) : null}

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
          {!required && (
            <span className="mt-1 block text-xs font-normal normal-case tracking-normal text-gray-500">
              (optional)
            </span>
          )}
        </button>
      </div>
    </FormStep>
  );
}
