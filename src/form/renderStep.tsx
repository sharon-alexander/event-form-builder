import type { FormData } from "../types";
import type { LocationConfig, StepId } from "../locations/types";
import type { StepProps } from "../components/steps/stepProps";
import EventTypeStep from "../components/steps/EventTypeStep";
import HeadcountStep from "../components/steps/HeadcountStep";
import EventFormatStep from "../components/steps/EventFormatStep";
import EventDateStep from "../components/steps/EventDateStep";
import BudgetStep from "../components/steps/BudgetStep";
import VenueSpaceStep from "../components/steps/VenueSpaceStep";
import TimingStep from "../components/steps/TimingStep";
import ServicesStep from "../components/steps/ServicesStep";
import InfoAcknowledgeStep from "../components/steps/InfoAcknowledgeStep";
import OtherVenuesReferralStep from "../components/steps/OtherVenuesReferralStep";
import ContactStep from "../components/steps/ContactStep";

export function getStepProps(
  location: LocationConfig,
  stepId: StepId,
  base: Omit<StepProps, "stepId" | "moreDetails" | "title" | "subtitle">,
): StepProps {
  const copy = location.stepCopy?.[stepId];
  return {
    ...base,
    stepId,
    moreDetails: location.stepMoreDetails?.[stepId],
    title: copy?.title,
    subtitle: copy?.subtitle,
  };
}

export function renderStep(stepId: StepId, props: StepProps) {
  switch (stepId) {
    case "event_type":
      return <EventTypeStep {...props} />;
    case "headcount":
      return <HeadcountStep {...props} />;
    case "event_format":
      return <EventFormatStep {...props} />;
    case "event_date":
      return <EventDateStep {...props} />;
    case "budget":
      return <BudgetStep {...props} />;
    case "venue_space":
      return <VenueSpaceStep {...props} />;
    case "timing":
      return <TimingStep {...props} />;
    case "services":
      return <ServicesStep {...props} />;
    case "info_acknowledge":
      return <InfoAcknowledgeStep {...props} />;
    case "other_venues_referral":
      return <OtherVenuesReferralStep {...props} />;
    case "contact":
      return <ContactStep {...props} />;
    default:
      return null;
  }
}

export function hasStepData(stepId: StepId, data: FormData): boolean {
  switch (stepId) {
    case "event_type":
      return data.bookingType !== null;
    case "headcount":
      return data.guestCount !== null;
    case "event_format":
      return data.eventCategory !== null || data.eventFormat !== null;
    case "event_date":
      return data.datesFlexible || data.eventDate !== "";
    case "budget":
      return data.budget !== null;
    case "venue_space":
      return data.venueSpace !== null;
    case "timing":
      return (
        data.timingFlexible ||
        data.startTime !== "" ||
        (data.mealService !== null && data.startTime !== "")
      );
    case "services":
      return data.services.length > 0;
    case "info_acknowledge":
      return data.infoAcknowledged;
    case "other_venues_referral":
      return data.consideringOtherVenues !== null || data.referralSource !== null;
    case "contact":
      return data.firstName !== "" || data.email !== "";
    default:
      return false;
  }
}
