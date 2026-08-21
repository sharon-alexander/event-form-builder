import type { InfoPageConfig, InfoPageSection } from "../../../locations/types";
import type { EditableLocation } from "../../pages/FormEditorPage";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
}

function emptyPage(): InfoPageConfig {
  return { title: "", intro: "", sections: [] };
}

function emptySection(): InfoPageSection {
  return { heading: "", body: "", bullets: [""] };
}

export default function InfoPageEditor({ draft, update }: Props) {
  const page = draft.info_page ?? emptyPage();
  const sections = page.sections ?? [];

  function setPage(next: InfoPageConfig) {
    update({ info_page: next });
  }

  function patchPage(patch: Partial<InfoPageConfig>) {
    setPage({ ...page, ...patch });
  }

  function setSection(index: number, patch: Partial<InfoPageSection>) {
    const next = sections.map((s, i) => (i === index ? { ...s, ...patch } : s));
    patchPage({ sections: next });
  }

  function removeSection(index: number) {
    patchPage({ sections: sections.filter((_, i) => i !== index) });
  }

  function addSection() {
    patchPage({ sections: [...sections, emptySection()] });
  }

  function setBullet(sectionIndex: number, bulletIndex: number, value: string) {
    const section = sections[sectionIndex];
    if (!section) return;
    const bullets = [...(section.bullets ?? [])];
    bullets[bulletIndex] = value;
    setSection(sectionIndex, { bullets });
  }

  function addBullet(sectionIndex: number) {
    const section = sections[sectionIndex];
    if (!section) return;
    setSection(sectionIndex, { bullets: [...(section.bullets ?? []), ""] });
  }

  function removeBullet(sectionIndex: number, bulletIndex: number) {
    const section = sections[sectionIndex];
    if (!section) return;
    const bullets = (section.bullets ?? []).filter((_, i) => i !== bulletIndex);
    setSection(sectionIndex, { bullets });
  }

  return (
    <section className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">Info page content</h3>
        <p className="mt-0.5 text-xs text-zinc-400">
          Shown on the acknowledgement step. People must tap “I Understand” to continue.
        </p>
      </div>

      <div>
        <label className="adm-label" htmlFor="info-title">
          Title
        </label>
        <input
          id="info-title"
          className="adm-input"
          placeholder="e.g. Food & Beverage Service"
          value={page.title}
          onChange={(e) => patchPage({ title: e.target.value })}
        />
      </div>

      <div>
        <label className="adm-label" htmlFor="info-intro">
          Intro
        </label>
        <textarea
          id="info-intro"
          rows={3}
          className="adm-input"
          placeholder="Optional intro paragraph…"
          value={page.intro ?? ""}
          onChange={(e) => patchPage({ intro: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Sections
          </h4>
          <button
            type="button"
            className="adm-btn-secondary px-3 py-1.5 text-xs"
            onClick={addSection}
          >
            Add section
          </button>
        </div>

        {sections.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-200 px-4 py-6 text-center text-xs text-zinc-400">
            No sections yet. Add one for headings and bullet lists.
          </p>
        ) : (
          sections.map((section, i) => (
            <div
              key={i}
              className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-zinc-500">Section {i + 1}</p>
                <button
                  type="button"
                  className="text-xs text-zinc-400 hover:text-red-500"
                  onClick={() => removeSection(i)}
                >
                  Remove
                </button>
              </div>

              <div>
                <label className="adm-label" htmlFor={`info-heading-${i}`}>
                  Heading
                </label>
                <input
                  id={`info-heading-${i}`}
                  className="adm-input py-2"
                  placeholder="e.g. Food:"
                  value={section.heading ?? ""}
                  onChange={(e) => setSection(i, { heading: e.target.value })}
                />
              </div>

              <div>
                <label className="adm-label" htmlFor={`info-body-${i}`}>
                  Body
                </label>
                <textarea
                  id={`info-body-${i}`}
                  rows={2}
                  className="adm-input"
                  placeholder="Optional paragraph…"
                  value={section.body ?? ""}
                  onChange={(e) => setSection(i, { body: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="adm-label mb-0">Bullets</label>
                  <button
                    type="button"
                    className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
                    onClick={() => addBullet(i)}
                  >
                    + Add bullet
                  </button>
                </div>
                {(section.bullets ?? []).map((bullet, j) => (
                  <div key={j} className="flex gap-2">
                    <input
                      className="adm-input py-2"
                      placeholder="Bullet text…"
                      value={bullet}
                      onChange={(e) => setBullet(i, j, e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label="Remove bullet"
                      className="shrink-0 rounded-md px-2 text-zinc-300 hover:bg-red-50 hover:text-red-500"
                      onClick={() => removeBullet(i, j)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
