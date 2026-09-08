import { useState } from "react";
import type { VenueSpaceOption } from "../../locations/types";
import { useLocationConfig } from "../../context/LocationContext";
import { DEFAULT_STEP_COPY } from "../../form/defaultStepCopy";
import { isFieldRequired, isStepValid } from "../../form/fieldCatalog";
import RequiredMark from "../../form/RequiredMark";
import FormStep from "../FormStep";
import MediaGalleryModal from "../MediaGalleryModal";
import { MediaThumb } from "../MediaThumb";
import type { StepProps } from "./stepProps";

const copy = DEFAULT_STEP_COPY.venue_space;

export default function VenueSpaceStep({
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
  const { venueSpaces, allowMultipleVenueSpaces } = location;
  const allowMultiple = !!allowMultipleVenueSpaces;
  const selected = data.venueSpace;
  const [galleryVenue, setGalleryVenue] = useState<VenueSpaceOption | null>(null);

  function selectSpace(value: string) {
    if (!allowMultiple) {
      onChange({ venueSpace: [value] });
      return;
    }
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange({ venueSpace: next });
  }

  return (
    <>
      <FormStep
        title={title}
        subtitle={subtitle}
        moreDetails={moreDetails}
        onNext={onNext}
        onBack={onBack}
        nextLabel={nextLabel}
        nextDisabled={!isStepValid("venue_space", data, location)}
      >
        <p className="efb-label">
          Venue space
          <RequiredMark required={isFieldRequired(location, "venueSpace")} />
        </p>
        {allowMultiple && (
          <p className="-mt-1 mb-3 text-sm text-gray-500">Select all that apply.</p>
        )}
        <div className="gap-4 sm:columns-2 [&>*]:mb-4">
          {venueSpaces.map((v) => {
            const media = v.galleryMedia ?? [];
            const hasGallery = media.length > 0;
            const preview = media[0];
            const isSelected = selected.includes(v.value);

            return (
              <div key={v.value} className="relative break-inside-avoid">
                <button
                  type="button"
                  onClick={() => selectSpace(v.value)}
                  aria-pressed={isSelected}
                  className={`efb-card w-full text-left ${isSelected ? "efb-card-selected" : ""}`}
                >
                  {preview && (
                    <div className="mb-3 overflow-hidden rounded-md">
                      <MediaThumb
                        item={preview}
                        className="h-32 w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    {allowMultiple && (
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          isSelected
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900">{v.label}</div>
                      {v.price && <div className="mt-1 text-xs text-brand-600">{v.price}</div>}
                    </div>
                  </div>
                </button>

                {hasGallery && (
                  <button
                    type="button"
                    onClick={() => setGalleryVenue(v)}
                    aria-label={`View photos of ${v.label}`}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-brand-700 shadow-sm ring-1 ring-brand-200 transition-colors hover:bg-white"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {media.length}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </FormStep>

      <MediaGalleryModal
        title={galleryVenue?.label ?? ""}
        media={galleryVenue?.galleryMedia ?? []}
        open={galleryVenue !== null}
        onClose={() => setGalleryVenue(null)}
      />
    </>
  );
}
