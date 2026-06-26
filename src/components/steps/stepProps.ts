import type { FormData } from "../../types";
import type { StepId } from "../../locations/types";

export interface StepProps {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  stepId: StepId;
  moreDetails?: string;
  title?: string;
  subtitle?: string;
}
