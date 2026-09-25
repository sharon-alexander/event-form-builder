import { useMemo } from "react";
import { useLocationConfig } from "../../context/LocationContext";
import {
  evaluateRules,
  messagesForField,
} from "../../form/conditions";
import { DEFAULT_STEP_COPY } from "../../form/defaultStepCopy";
import { isFieldRequired, isStepValid } from "../../form/fieldCatalog";
import RequiredMark from "../../form/RequiredMark";
import { isEmptyRichText, toDisplayHtml } from "../../utils/richText";
import FormStep from "../FormStep";
import type { StepProps } from "./stepProps";

const copy = DEFAULT_STEP_COPY.headcount;

export default function HeadcountStep({
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
  const evaluation = useMemo(
    () => evaluateRules(location.formRules, data),
    [location.formRules, data],
  );
  const messages = messagesForField(evaluation, "guestCount");
  const blocking = evaluation.blockedFields.has("guestCount");
  const visibleMessages = messages.filter((message) => !isEmptyRichText(message.html));

  return (
    <FormStep
      title={title}
      subtitle={subtitle}
      moreDetails={moreDetails}
      onNext={onNext}
      onBack={onBack}
      nextLabel={nextLabel}
      nextDisabled={!isStepValid("headcount", data, location)}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="guest-count" className="efb-label">
            Estimated Headcount
            <RequiredMark required={isFieldRequired(location, "guestCount")} />
          </label>
          <input
            id="guest-count"
            type="number"
            min={1}
            max={1000}
            placeholder="Number of guests"
            value={data.guestCount ?? ""}
            onChange={(e) =>
              onChange({ guestCount: e.target.value ? Number(e.target.value) : null })
            }
            className="efb-input max-w-xs"
          />
        </div>
        {blocking && visibleMessages.length === 0 && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Enter fewer guests to continue.
          </p>
        )}
        {visibleMessages.map((message) => (
          <div
            key={message.ruleId}
            className={`efb-rich-text rounded-lg border px-3 py-2 text-sm ${
              message.severity === "block"
                ? "border-red-200 bg-red-50 text-red-800"
                : message.severity === "warn"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-brand-100 bg-brand-50 text-gray-700"
            }`}
            dangerouslySetInnerHTML={{ __html: toDisplayHtml(message.html) }}
          />
        ))}
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={data.headcountMayChange}
            onChange={(e) => onChange({ headcountMayChange: e.target.checked })}
            className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm font-medium text-gray-700">My headcount may change</span>
        </label>
      </div>
    </FormStep>
  );
}
