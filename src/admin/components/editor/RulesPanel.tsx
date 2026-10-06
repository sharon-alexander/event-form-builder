import type { EditableLocation } from "../../pages/FormEditorPage";
import HeadcountLimitsEditor from "./HeadcountLimitsEditor";
import BudgetRangesEditor from "./BudgetRangesEditor";
import VenueSpacesEditor from "./VenueSpacesEditor";
import TimingStyleEditor from "./TimingStyleEditor";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
  orgId: string | null;
  onError: (msg: string) => void;
}

export default function RulesPanel({ draft, update, orgId, onError }: Props) {
  const ruleCount = draft.form_rules?.rules.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Form behavior</p>
        <h3 className="mt-1 text-base font-semibold text-zinc-900">Rules & availability</h3>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-zinc-500">
          Set guardrails once, in the same place. Each rule is written in plain language and updates the live preview on the left.
        </p>
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">1</div>
          <div>
            <p className="text-xs font-semibold text-indigo-950">Start with the answer that controls the rule</p>
            <p className="mt-1 text-xs leading-relaxed text-indigo-900/70">
              Open a section only when you need it. Set the guest count once, then use availability on each option to say when guests can choose it.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <RuleType label="Message" detail="Tell guests what to do" />
          <RuleType label="Limit" detail="Stop outside capacity" />
          <RuleType label="Availability" detail="Show only valid options" />
        </div>
      </div>

      <section className="space-y-3">
        <SectionHeading title="Guest count" description="Show guidance or stop a guest when the party is outside your capacity." />
        <HeadcountLimitsEditor draft={draft} update={update} />
      </section>

      <section className="space-y-3">
        <SectionHeading title="Choice availability" description="Limit a space, budget range, or dining option based on the guest's answers." />
        <div className="space-y-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h4 className="text-sm font-medium text-zinc-900">Venue spaces</h4>
            <p className="mt-0.5 text-xs text-zinc-500">For example, make a room available to parties of 7–40.</p>
            <div className="mt-3"><VenueSpacesEditor draft={draft} update={update} orgId={orgId} onError={onError} /></div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h4 className="text-sm font-medium text-zinc-900">Budget ranges</h4>
            <p className="mt-0.5 text-xs text-zinc-500">For example, hide $1,500–$2,500 for groups of 16+.</p>
            <div className="mt-3"><BudgetRangesEditor draft={draft} update={update} /></div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h4 className="text-sm font-medium text-zinc-900">Dining options</h4>
            <p className="mt-0.5 text-xs text-zinc-500">For example, Cocktail Bar for 7–40 and Vinyl Jukebox for 7–20.</p>
            <div className="mt-3"><TimingStyleEditor draft={draft} update={update} /></div>
          </div>
        </div>
      </section>

      <p className="text-xs text-zinc-400">{ruleCount === 0 ? "No rules configured yet." : `${ruleCount} rule${ruleCount === 1 ? "" : "s"} active across this form.`}</p>
    </div>
  );
}

function RuleType({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="rounded-lg border border-indigo-100 bg-white/80 px-3 py-2">
      <p className="text-xs font-semibold text-indigo-950">{label}</p>
      <p className="mt-0.5 text-[11px] text-indigo-900/60">{detail}</p>
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return <div><h4 className="text-sm font-semibold text-zinc-900">{title}</h4><p className="mt-0.5 text-xs text-zinc-500">{description}</p></div>;
}

export { RulesPanel };
