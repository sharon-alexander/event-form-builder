import { useState, useCallback } from "react";
import type { FormData } from "./types";
import { INITIAL_FORM_DATA } from "./types";
import { TRIPLESEAT_CONFIG } from "./config";
import { buildPayload } from "./utils/buildPayload";
import { submitLead } from "./api/tripleseat";
import LandingPage from "./components/LandingPage";
import ProgressBar from "./components/ProgressBar";
import EventSummary from "./components/EventSummary";
import EventTypeStep from "./components/steps/EventTypeStep";
import EventCategoryStep from "./components/steps/EventCategoryStep";
import EventFormatStep from "./components/steps/EventFormatStep";
import EventDateStep from "./components/steps/EventDateStep";
import BudgetStep from "./components/steps/BudgetStep";
import VenueSpaceStep from "./components/steps/VenueSpaceStep";
import TimingStep from "./components/steps/TimingStep";
import ServicesStep from "./components/steps/ServicesStep";
import OtherVenuesStep from "./components/steps/OtherVenuesStep";
import ReferralStep from "./components/steps/ReferralStep";
import ContactInfoStep from "./components/steps/ContactInfoStep";
import ReviewStep from "./components/steps/ReviewStep";

const TOTAL_STEPS = 12;

export default function App() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Honeypot — hidden field to catch bots
  const [honeypot, setHoneypot] = useState("");

  const update = useCallback((patch: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const next = useCallback(() => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)), []);
  const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  const handleSubmit = useCallback(async () => {
    if (honeypot) return; // bot detected

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = buildPayload(data, {
        locationId: TRIPLESEAT_CONFIG.locationId,
        leadFormId: TRIPLESEAT_CONFIG.leadFormId,
      });
      await submitLead(payload);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [data, honeypot]);

  if (!started) {
    return <LandingPage onStart={() => setStarted(true)} />;
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Honeypot */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <input
          tabIndex={-1}
          autoComplete="off"
          name="website_url"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />

          {/* Collapsible summary for smaller screens */}
          <details className="mb-6 rounded-xl border border-brand-100 bg-brand-50/60 lg:hidden">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-brand-700">
              View your event summary
            </summary>
            <div className="px-2 pb-2">
              <EventSummary data={data} />
            </div>
          </details>

          {step === 0 && <EventTypeStep data={data} onChange={update} onNext={next} />}
          {step === 1 && <EventCategoryStep data={data} onChange={update} onNext={next} onBack={back} />}
          {step === 2 && <EventFormatStep data={data} onChange={update} onNext={next} onBack={back} />}
          {step === 3 && <EventDateStep data={data} onChange={update} onNext={next} onBack={back} />}
          {step === 4 && <BudgetStep data={data} onChange={update} onNext={next} onBack={back} />}
          {step === 5 && <VenueSpaceStep data={data} onChange={update} onNext={next} onBack={back} />}
          {step === 6 && <TimingStep data={data} onChange={update} onNext={next} onBack={back} />}
          {step === 7 && <ServicesStep data={data} onChange={update} onNext={next} onBack={back} />}
          {step === 8 && <OtherVenuesStep data={data} onChange={update} onNext={next} onBack={back} />}
          {step === 9 && <ReferralStep data={data} onChange={update} onNext={next} onBack={back} />}
          {step === 10 && <ContactInfoStep data={data} onChange={update} onNext={next} onBack={back} />}
          {step === 11 && (
            <ReviewStep
              data={data}
              onSubmit={handleSubmit}
              onBack={back}
              isSubmitting={isSubmitting}
              error={submitError}
            />
          )}
        </div>

        {/* Sticky summary sidebar for large screens */}
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <EventSummary data={data} />
          </div>
        </aside>
      </div>
    </div>
  );
}
