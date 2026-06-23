import type { TripleseatConfig } from "../../../locations/types";
import type { EditableLocation } from "../../pages/FormEditorPage";

interface Props {
  draft: EditableLocation;
  update: (patch: Partial<EditableLocation>) => void;
}

export default function AdvancedTab({ draft, update }: Props) {
  const ts = draft.tripleseat;

  function setTs(patch: Partial<TripleseatConfig>) {
    update({ tripleseat: { ...ts, ...patch } });
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-900">Tripleseat</h2>
      <p className="mt-0.5 text-xs text-gray-400">
        Credentials used to submit leads. Referral source IDs are resolved
        automatically from Tripleseat when the form loads.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="efb-label" htmlFor="publicKey">
            Public key
          </label>
          <input
            id="publicKey"
            className="efb-input font-mono"
            value={ts.publicKey ?? ""}
            onChange={(e) => setTs({ publicKey: e.target.value })}
          />
        </div>
        <div>
          <label className="efb-label" htmlFor="leadFormId">
            Lead form ID
          </label>
          <input
            id="leadFormId"
            type="number"
            className="efb-input"
            value={ts.leadFormId ?? ""}
            onChange={(e) =>
              setTs({ leadFormId: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
        <div>
          <label className="efb-label" htmlFor="locationId">
            Location ID
          </label>
          <input
            id="locationId"
            type="number"
            className="efb-input"
            value={ts.locationId ?? ""}
            onChange={(e) =>
              setTs({ locationId: e.target.value ? Number(e.target.value) : undefined })
            }
          />
        </div>
        <div className="sm:col-span-2">
          <label className="efb-label" htmlFor="apiBaseUrl">
            API base URL
          </label>
          <p className="mb-1 text-xs text-gray-400">
            Leave blank to use the default (<code className="text-gray-500">https://api.tripleseat.com/v1</code>).
            Only change this if Tripleseat provides a different endpoint.
          </p>
          <input
            id="apiBaseUrl"
            className="efb-input font-mono"
            placeholder="https://api.tripleseat.com/v1"
            value={ts.apiBaseUrl ?? ""}
            onChange={(e) => setTs({ apiBaseUrl: e.target.value })}
          />
        </div>
      </div>
    </section>
  );
}
