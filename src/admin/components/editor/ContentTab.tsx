import type { EditableLocation } from "../../pages/FormEditorPage";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
}

export default function ContentTab({ draft, update }: Props) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="efb-label" htmlFor="name">
            Venue name
          </label>
          <input
            id="name"
            className="efb-input"
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
          />
          <p className="mt-1 text-xs text-gray-400">Shown as the heading on the form.</p>
        </div>
        <div>
          <label className="efb-label" htmlFor="slug">
            URL slug
          </label>
          <input
            id="slug"
            className="efb-input"
            value={draft.slug}
            onChange={(e) =>
              update({
                slug: e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]+/g, "-")
                  .replace(/^-+/, ""),
              })
            }
          />
          <p className="mt-1 text-xs text-gray-400">
            Used in <code>?location={draft.slug || "slug"}</code> and embeds. Must be unique.
          </p>
        </div>
      </div>

      <div>
        <label className="efb-label" htmlFor="form_title">
          Eyebrow label
        </label>
        <input
          id="form_title"
          className="efb-input"
          value={draft.form_title}
          onChange={(e) => update({ form_title: e.target.value })}
        />
        <p className="mt-1 text-xs text-gray-400">
          Small label above the venue name, e.g. "Private Events".
        </p>
      </div>

      <div>
        <label className="efb-label" htmlFor="about_blurb">
          About blurb
        </label>
        <textarea
          id="about_blurb"
          rows={5}
          className="efb-input"
          value={draft.about_blurb}
          onChange={(e) => update({ about_blurb: e.target.value })}
        />
        <p className="mt-1 text-xs text-gray-400">
          Paragraph shown on the landing page below the venue name.
        </p>
      </div>
    </div>
  );
}
