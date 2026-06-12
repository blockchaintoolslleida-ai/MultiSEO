/**
 * Tests for validate.ts — request validation helpers (Zod-powered).
 */
import { describe, it, expect, vi } from "vitest";
import { z, ZodError } from "zod";
import { parseSearchParams, parseBody, validationErrorResponse } from "./validate";

// ---------------------------------------------------------------------------
// Shared test schemas
// ---------------------------------------------------------------------------
const singleStringSchema = z.object({ key: z.string() });
const userSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
});
const multiSchema = z.object({ a: z.string(), b: z.string() });

// ---------------------------------------------------------------------------
// parseSearchParams
// ---------------------------------------------------------------------------
describe("parseSearchParams", () => {
  it("parses valid params using a simple object schema", () => {
    // Arrange
    const req = new Request("http://test?key=hello");

    // Act
    const result = parseSearchParams(req, singleStringSchema);

    // Assert
    expect(result).toEqual({ key: "hello" });
  });

  it("throws ZodError when a value does not match the schema type", () => {
    // Arrange — schema expects string, we send a number-like value (still a string from URLSearchParams)
    // To trigger a type mismatch we need a schema that rejects the value after coercion.
    const numSchema = z.object({ count: z.coerce.number().min(1) });
    const req = new Request("http://test?count=not-a-number");

    // Act & Assert
    expect(() => parseSearchParams(req, numSchema)).toThrow(ZodError);
  });

  it("throws when a required field is missing", () => {
    // Arrange
    const req = new Request("http://test?other=value");

    // Act & Assert
    expect(() => parseSearchParams(req, singleStringSchema)).toThrow(ZodError);
  });

  it("parses multiple search params", () => {
    // Arrange
    const req = new Request("http://test?a=1&b=2");

    // Act
    const result = parseSearchParams(req, multiSchema);

    // Assert
    expect(result).toEqual({ a: "1", b: "2" });
  });
});

// ---------------------------------------------------------------------------
// parseBody
// ---------------------------------------------------------------------------
describe("parseBody", () => {
  it("parses a valid JSON body with the given schema", async () => {
    // Arrange
    const req = new Request("http://test", {
      method: "POST",
      body: JSON.stringify({ name: "Alice", age: 30 }),
    });

    // Act
    const result = await parseBody(req, userSchema);

    // Assert
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  it("throws ZodError when the body does not match the schema", async () => {
    // Arrange
    const req = new Request("http://test", {
      method: "POST",
      body: JSON.stringify({ name: "Alice", age: -5 }),
    });

    // Act & Assert
    await expect(parseBody(req, userSchema)).rejects.toThrow(ZodError);
  });

  it("throws when a required field is missing", async () => {
    // Arrange
    const req = new Request("http://test", {
      method: "POST",
      body: JSON.stringify({ name: "Alice" }),
    });

    // Act & Assert
    await expect(parseBody(req, userSchema)).rejects.toThrow(ZodError);
  });

  it("throws when the body is empty", async () => {
    // Arrange
    const req = new Request("http://test", {
      method: "POST",
      body: "",
    });

    // Act & Assert — empty body causes JSON parse error
    await expect(parseBody(req, singleStringSchema)).rejects.toThrow();
  });

  it("throws when a field has the wrong type", async () => {
    // Arrange
    const req = new Request("http://test", {
      method: "POST",
      body: JSON.stringify({ name: "Alice", age: "not-a-number" }),
    });

    // Act & Assert
    await expect(parseBody(req, userSchema)).rejects.toThrow(ZodError);
  });
});

// ---------------------------------------------------------------------------
// validationErrorResponse
// ---------------------------------------------------------------------------
describe("validationErrorResponse", () => {
  function makeZodError(): ZodError {
    const schema = z.object({ name: z.string() });
    try {
      schema.parse({ name: 123 });
    } catch (e) {
      return e as ZodError;
    }
    throw new Error("Expected ZodError was not thrown");
  }

  it("includes field-level details in dev mode", () => {
    vi.stubEnv("NODE_ENV", "development");
    const zodError = makeZodError();

    const res = validationErrorResponse(zodError);

    expect(res.status).toBe(400);
    return res.json().then((body) => {
      expect(body.error).toBe("Validation failed");
      expect(body.details).toBeDefined();
      // ZodError.flatten() returns { formErrors, fieldErrors }
      expect(body.details).toHaveProperty("fieldErrors");
      expect(body.details).toHaveProperty("formErrors");
    });
  });

  it("excludes details in production mode", () => {
    vi.stubEnv("NODE_ENV", "production");
    const zodError = makeZodError();

    const res = validationErrorResponse(zodError);

    expect(res.status).toBe(400);
    return res.json().then((body) => {
      expect(body.error).toBe("Validation failed");
      expect(body.details).toBeUndefined();
    });
  });

  it("always returns status 400", () => {
    vi.stubEnv("NODE_ENV", "production");
    const zodError = makeZodError();

    const res = validationErrorResponse(zodError);

    expect(res.status).toBe(400);
  });
});
