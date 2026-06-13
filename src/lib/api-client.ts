/**
 * Frontend API client wrapper.
 *
 * Automatically includes the CSRF token header on state-changing requests,
 * reads it from the multiseo_csrf cookie (which is NOT HttpOnly, so JS can access it).
 *
 * Components should prefer this over raw fetch() for POST/PATCH/DELETE calls.
 */

function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)multiseo_csrf=([^;]*)/);
  return match ? match[1] : null;
}

type HttpMethod = "GET" | "HEAD" | "POST" | "PATCH" | "DELETE";

interface ApiFetchOptions extends Omit<RequestInit, "method" | "body"> {
  method?: HttpMethod;
  body?: unknown;
}

/**
 * Fetch wrapper that adds CSRF token for state-changing methods.
 * Automatically serializes body as JSON and sets Content-Type.
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { method = "GET", body, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    ...(extraHeaders as Record<string, string>),
  };

  // Add CSRF token for state-changing methods
  const stateChanging = method !== "GET" && method !== "HEAD";
  if (stateChanging) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers["x-csrf-token"] = csrfToken;
    }
  }

  // Serialize body as JSON
  let serializedBody: BodyInit | undefined;
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    serializedBody = JSON.stringify(body);
  }

  const res = await fetch(url, {
    method,
    headers,
    body: serializedBody,
    credentials: "same-origin",
    ...rest,
  });

  // Read body as text first so we never crash on empty/invalid JSON
  const text = await res.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text);
  } catch {
    json = {};
  }

  if (!res.ok) {
    const errMsg =
      typeof json.error === "string" ? json.error : `Request failed with status ${res.status}`;
    throw new Error(errMsg);
  }

  return json as T;
}
