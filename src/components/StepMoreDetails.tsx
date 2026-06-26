interface Props {
  content?: string;
}

/** Optional read-only "More Details" block shown below step inputs. */
export default function StepMoreDetails({ content }: Props) {
  if (!content?.trim()) return null;

  return (
    <div className="mt-6 border-t border-brand-100 pt-6">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-brand-800">
        More Details
      </h3>
      <div className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{content}</div>
    </div>
  );
}
