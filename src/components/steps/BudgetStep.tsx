import { useMemo } from "react";
import { useLocationConfig } from "../../context/LocationContext";
import {
  evaluateRules,
  messagesForField,
  isFieldHidden,
  visibleBudgetOptions,
} from "../../form/conditions";
import { DEFAULT_STEP_COPY } from "../../form/defaultStepCopy";
import { isFieldRequired, isStepValid } from "../../form/fieldCatalog";
import RequiredMark from "../../form/RequiredMark";
import { isEmptyRichText, toDisplayHtml } from "../../utils/richText";
import FormStep from "../FormStep";
import type { StepProps } from "./stepProps";

const copy = DEFAULT_STEP_COPY.budget;

export default function BudgetStep({
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
  const budgetOptions = visibleBudgetOptions(location.budgetOptions, evaluation);
  const messages = messagesForField(evaluation, "budget").filter(
    (message) => !isEmptyRichText(message.html),
  );

  return (
    <FormStep
      title={title}
      subtitle={subtitle}
      moreDetails={moreDetails}
      onNext={onNext}
      onBack={onBack}
      nextLabel={nextLabel}
      nextDisabled={!isStepValid("budget", data, location)}
    >
      {!isFieldHidden(evaluation, "budget") && (
      <>
      <p className="efb-label">
        Budget range
        <RequiredMark required={isFieldRequired(location, "budget")} />
      </p>
      {messages.map((message) => (
        <div
          key={message.ruleId}
          className={`efb-rich-text mb-3 rounded-lg border px-3 py-2 text-sm ${
            message.severity === "block"
              ? "border-red-200 bg-red-50 text-red-800"
              : message.severity === "warn"
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-brand-100 bg-brand-50 text-gray-700"
          }`}
          dangerouslySetInnerHTML={{ __html: toDisplayHtml(message.html) }}
        />
      ))}
      {budgetOptions.length === 0 ? (
        <p className="text-sm text-gray-500">
          No budget ranges match these event details. Go back and adjust your answers.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {budgetOptions.map((b) => (
            <button
              key={b.value}
              type="button"
              onClick={() => onChange({ budget: b.value })}
              className={`efb-card ${data.budget === b.value ? "efb-card-selected" : ""}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
      </>
      )}
    </FormStep>
  );
}
