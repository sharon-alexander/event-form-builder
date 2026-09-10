export default function RequiredMark({ required }: { required: boolean }) {
  if (required) return <> *</>;
  return <span className="font-normal text-gray-400"> (optional)</span>;
}
