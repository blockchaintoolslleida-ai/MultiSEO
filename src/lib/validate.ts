/**
 * Request validation helpers for MultiSEO API routes.
 *
 * Uses Zod for schema-based validation of query params and JSON bodies.
 * Every API route should use these instead of manual `if (!x)` checks.
 */
import { z, ZodSchema, ZodError } from "zod";

/**
 * Parse and validate URL search params against a Zod schema.
 * Returns the validated data or throws ZodError.
 */
export function parseSearchParams<T>(
  request: Request,
  schema: ZodSchema<T>
): T {
  const url = new URL(request.url);
  const raw: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    raw[key] = value;
  });
  return schema.parse(raw);
}

/**
 * Parse and validate a JSON request body against a Zod schema.
 * Returns the validated data or throws ZodError.
 */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T> {
  const json = await request.json();
  return schema.parse(json);
}

/**
 * Build a 400 JSON response from a ZodError.
 * In development, includes field-level details. In production, only the generic message.
 */
export function validationErrorResponse(error: ZodError): Response {
  const isDev = process.env.NODE_ENV === "development";
  return Response.json(
    {
      error: "Validation failed",
      ...(isDev && { details: error.flatten() }),
    },
    { status: 400 }
  );
}

// ---- Common schemas reused across routes ----

/** Non-empty string helper. */
export const nonEmptyString = z.string().min(1);

/** Valid UUID v4 string. */
export const uuidSchema = z.string().uuid();

/** Positive integer. */
export const positiveInt = z.number().int().positive();
