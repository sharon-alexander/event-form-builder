import type { TripleseatLeadPayload } from "../utils/buildPayload";
import type { TripleseatConfig } from "../locations";

interface TripleseatSuccessResponse {
  success_message: string;
}

interface TripleseatErrorResponse {
  errors: string[] | Record<string, string[]>;
}

type TripleseatResponse = TripleseatSuccessResponse | TripleseatErrorResponse;

function isErrorResponse(res: TripleseatResponse): res is TripleseatErrorResponse {
  return "errors" in res;
}

function formatErrors(errors: string[] | Record<string, string[]>): string {
  if (Array.isArray(errors)) return errors.join(". ");
  return Object.entries(errors)
    .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
    .join(". ");
}

/**
 * Submits a lead to Tripleseat using JSONP for cross-domain compatibility.
 * Falls back to a standard fetch POST if JSONP fails.
 */
export async function submitLead(
  payload: TripleseatLeadPayload,
  config: TripleseatConfig,
): Promise<string> {
  const publicKey = config.publicKey;
  if (!publicKey) {
    throw new Error(
      "Tripleseat public key is not configured. Set the appropriate VITE_*_TRIPLESEAT_PUBLIC_KEY in your environment.",
    );
  }

  const url = `${config.apiBaseUrl}/leads/create.js?public_key=${encodeURIComponent(publicKey)}`;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(payload.lead)) {
    if (value !== undefined && value !== null) {
      params.append(`lead[${key}]`, String(value));
    }
  }
  if (payload.lead_form_id !== undefined) {
    params.append("lead_form_id", String(payload.lead_form_id));
  }
  params.append("simple_error_messages", "true");

  try {
    return await jsonpRequest(`${url}&${params.toString()}`);
  } catch {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, simple_error_messages: true }),
    });
    const data: TripleseatResponse = await res.json();
    if (isErrorResponse(data)) throw new Error(formatErrors(data.errors));
    return data.success_message;
  }
}

function jsonpRequest(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const callbackName = `__tripleseat_cb_${Date.now()}`;
    const script = document.createElement("script");

    const win = window as unknown as Record<string, unknown>;

    const cleanup = () => {
      delete win[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Request timed out"));
    }, 15_000);

    win[callbackName] = (data: TripleseatResponse) => {
      clearTimeout(timeout);
      cleanup();
      if (isErrorResponse(data)) {
        reject(new Error(formatErrors(data.errors)));
      } else {
        resolve(data.success_message);
      }
    };

    script.src = `${url}&callback=${callbackName}`;
    script.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error("Network error submitting lead"));
    };
    document.body.appendChild(script);
  });
}
