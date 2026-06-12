/**
 * Standardized API response helpers for MultiSEO routes.
 *
 * All routes should use these instead of manually constructing
 * Response.json() calls, to ensure consistent error sanitization.
 */

/**
 * Build a standardized success response.
 */
export function successResponse<T>(data: T, status = 200): Response {
  return Response.json({ data }, { status });
}

/**
 * Build a standardized error response.
 *
 * In production, returns a generic message to avoid leaking internal details.
 * In development, includes the actual error message for debugging.
 */
export function errorResponse(error: unknown, status = 500): Response {
  const isDev = process.env.NODE_ENV === "development";

  let message: string;
  if (error instanceof Response) {
    // Re-throw Response objects (from getTenantId, verifyWebsiteOwnership, etc.)
    throw error;
  } else if (error instanceof Error) {
    message = isDev ? error.message : "An internal error occurred. Please try again later.";
  } else if (typeof error === "string") {
    message = isDev ? error : "An internal error occurred. Please try again later.";
  } else {
    message = isDev ? String(error) : "An internal error occurred. Please try again later.";
  }

  // Log the real error server-side
  if (!isDev) {
    console.error("[API Error]", error instanceof Error ? error.message : error);
  }

  return Response.json({ error: message }, { status });
}
