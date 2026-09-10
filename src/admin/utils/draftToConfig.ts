import { hasOptionLabel } from "../../locations/presentableOptions";
import type { LocationConfig } from "../../locations/types";
import { DEFAULT_EVENT_CATEGORIES, EVENT_FORMATS } from "../../types";
import { mergeInfoPageIntoMoreDetails } from "../../utils/richText";
import type { EditableLocation } from "../pages/FormEditorPage";

/**
 * Convert the admin draft (snake_case DB shape) into the public-facing
 * LocationConfig (camelCase) so preview components can render it directly.
 */
export function draftToLocationConfig(draft: EditableLocation): LocationConfig {
  const steps = draft.form_steps.length > 0 ? draft.form_steps : [];

  return {
    id: draft.slug,
    name: draft.name,
    formTitle: draft.form_title,
    aboutBlurb: draft.about_blurb,
    logoUrl: draft.theme?.logoUrl,
    galleryMedia: draft.gallery_media,
    venueSpaces: draft.venue_spaces.filter(hasOptionLabel),
    allowMultipleVenueSpaces: draft.allow_multiple_venue_spaces,
    showMultiDayRental: draft.show_multi_day_rental,
    showAdditionalLoadInOut: draft.show_additional_load_in_out,
    showFullDayRental: draft.show_full_day_rental,
    budgetOptions: draft.budget_options.filter(hasOptionLabel),
    eventCategories: draft.event_categories ?? DEFAULT_EVENT_CATEGORIES,
    eventFormats: draft.event_formats ?? EVENT_FORMATS,
    steps,
    stepMoreDetails: mergeInfoPageIntoMoreDetails(
      draft.step_more_details ?? {},
      draft.info_page,
    ),
    timingStyle:
      (draft.timing_style as LocationConfig["timingStyle"]) || "standard",
    infoPage: draft.info_page ? { title: draft.info_page.title } : undefined,
    requiredFields: draft.required_fields,
    tripleseat: {
      publicKey: draft.tripleseat?.publicKey ?? "",
      leadFormId: draft.tripleseat?.leadFormId,
      locationId: draft.tripleseat?.locationId,
      apiBaseUrl:
        draft.tripleseat?.apiBaseUrl || "https://api.tripleseat.com/v1",
    },
    referralSourceIds: {},
    referralOtherSourceId: 1,
  };
}
