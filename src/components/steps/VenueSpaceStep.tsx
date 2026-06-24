import { useState } from "react";
import type { FormData } from "../../types";
import type { VenueSpaceOption } from "../../locations/types";
import { useLocationConfig } from "../../context/LocationContext";
import FormStep from "../FormStep";
import MediaGalleryModal from "../MediaGalleryModal";

interface Props {
  data: FormData;
  onChange: (patch: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function VenueSpaceStep({ data, onChange, onNext, onBack }: Props) {
  const { venueSpaces } = useLocationConfig();
  const [galleryVenue, setGalleryVenue] = useState<VenueSpaceOption | null>(null);

  return (
    <>
      <FormStep
        title="Where would you like to host?"
        subtitle="Each space has its own character and capacity."
        onNext={onNext}
        onBack={onBack}
        nextDisabled={!data.venueSpace}
      >
        <div className="gap-4 sm:columns-2 [&>*]:mb-4">
          {venueSpaces.map((v) => {
            const media = v.galleryMedia ?? [];
            const hasGallery = media.length > 0;
            const preview = media[0];

            return (
              <div key={v.value} className="relative break-inside-avoid">
                <button
                  type="button"
                  onClick={() => onChange({ venueSpace: v.value })}
                  className={`efb-card w-full text-left ${data.venueSpace === v.value ? "efb-card-selected" : ""}`}
                >
                  {preview && (
                    <div className="mb-3 overflow-hidden rounded-md">
                      <img
                        src={preview.type === "video" ? (preview.poster ?? preview.src) : preview.src}
                        alt={preview.alt}
                        className="h-32 w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="font-semibold text-gray-900">{v.label}</div>
                  <div className="mt-1 text-xs text-brand-600">{v.price}</div>
                </button>

                {hasGallery && (
                  <button
                    type="button"
                    onClick={() => setGalleryVenue(v)}
                    aria-label={`View photos of ${v.label}`}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-brand-700 shadow-sm ring-1 ring-brand-200 transition-colors hover:bg-white"
                  >
                    <PhotosIcon />
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

function PhotosIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
