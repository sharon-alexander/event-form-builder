import { useState, useCallback } from "react";
import type { FormData } from "./types";
import { INITIAL_FORM_DATA } from "./types";
import { useLocationConfig } from "./context/LocationContext";
import { buildPayload } from "./utils/buildPayload";
import { submitLead } from "./api/tripleseat";
import { getStepProps, renderStep } from "./form/renderStep";
import LandingPage from "./components/LandingPage";
import ProgressBar from "./components/ProgressBar";
import EventSummary from "./components/EventSummary";
import ReviewStep from "./components/steps/ReviewStep";

export default function App() {
  const location = useLocationConfig();
  const formSteps = location.steps;
  const totalSteps = formSteps.length + 1;

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const update = useCallback((patch: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const next = useCallback(() => setStep((s) => Math.min(s + 1, totalSteps - 1)), [totalSteps]);
  const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  const handleSubmit = useCallback(async () => {
    if (honeypot) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = buildPayload(data, location);
      await submitLead(payload, location.tripleseat);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [data, honeypot, location]);

  if (!started) {
    return <LandingPage onStart={() => setStarted(true)} />;
  }

  if (submitted) {
    return (
      <div className="px-4 py-12 text-center sm:px-6">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-display text-3xl font-semibold text-gray-900">
          Thank you for your inquiry!
        </h2>
        <p className="mt-3 text-gray-500">
          We've received your event details and will be in touch shortly.
        </p>
      </div>
    );
  }

  const isReviewStep = step === formSteps.length;
  const currentStepId = formSteps[step];
  const isLastFormStep = step === formSteps.length - 1;

  const stepBase = {
    data,
    onChange: update,
    onNext: next,
    onBack: step > 0 ? back : undefined,
    nextLabel: isLastFormStep ? "Review & Submit" : undefined,
  };

  return (
    <div className="px-4 py-8 sm:px-6">
      <div aria-hidden="true" className="sr-only">
        <input
          tabIndex={-1}
          autoComplete="off"
          name="website_url"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div
        className={`grid grid-cols-1 gap-8${isReviewStep ? "" : " lg:grid-cols-[minmax(0,1fr)_300px]"}`}
      >
        <div>
          <ProgressBar currentStep={step} totalSteps={totalSteps} />

          {!isReviewStep && (
            <details className="mb-6 rounded-xl border border-brand-100 bg-brand-50/60 lg:hidden">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-brand-700">
                View your event summary
              </summary>
              <div className="px-2 pb-2">
                <EventSummary data={data} />
              </div>
            </details>
          )}

          {isReviewStep ? (
            <ReviewStep
              data={data}
              onSubmit={handleSubmit}
              onBack={back}
              isSubmitting={isSubmitting}
              error={submitError}
            />
          ) : currentStepId ? (
            renderStep(currentStepId, getStepProps(location, currentStepId, stepBase))
          ) : null}
        </div>

        {!isReviewStep && (
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <EventSummary data={data} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
