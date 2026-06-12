/**
 * Tests for api-responses.ts — standardized API response helpers.
 */
import { describe, it, expect, vi } from "vitest";
import { successResponse, errorResponse } from "./api-responses";

// ---------------------------------------------------------------------------
// successResponse
// ---------------------------------------------------------------------------
describe("successResponse", () => {
  it("returns JSON { data } with default status 200", async () => {
    // Arrange
    const payload = { id: 1, name: "test" };

    // Act
    const res = successResponse(payload);

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ data: payload });
  });

  it("accepts a custom status code", async () => {
    // Arrange
    const payload = { created: true };

    // Act
    const res = successResponse(payload, 201);

    // Assert
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ data: payload });
  });

  it("wraps a string in { data }", async () => {
    // Arrange
    const message = "Operation complete";

    // Act
    const res = successResponse(message);

    // Assert
    const body = await res.json();
    expect(body).toEqual({ data: message });
  });

  it("wraps an object in { data }", async () => {
    // Arrange
    const obj = { a: 1, b: 2 };

    // Act
    const res = successResponse(obj);

    // Assert
    const body = await res.json();
    expect(body).toEqual({ data: obj });
  });

  it("wraps an array in { data }", async () => {
    // Arrange
    const list = [1, 2, 3];

    // Act
    const res = successResponse(list);

    // Assert
    const body = await res.json();
    expect(body).toEqual({ data: list });
  });

  it("wraps null in { data }", async () => {
    // Act
    const res = successResponse(null);

    // Assert
    const body = await res.json();
    expect(body).toEqual({ data: null });
  });
});

// ---------------------------------------------------------------------------
// errorResponse
// ---------------------------------------------------------------------------
describe("errorResponse", () => {
  describe("when the error is an Error instance", () => {
    it("shows the actual message in dev mode", async () => {
      vi.stubEnv("NODE_ENV", "development");
      const err = new Error("Database connection refused");

      const res = errorResponse(err);
      const body = await res.json();

      expect(body).toEqual({ error: "Database connection refused" });
    });

    it("shows a generic message in production mode", async () => {
      vi.stubEnv("NODE_ENV", "production");
      const err = new Error("Database connection refused");

      const res = errorResponse(err);
      const body = await res.json();

      expect(body).toEqual({
        error: "An internal error occurred. Please try again later.",
      });
    });
  });

  describe("when the error is a string", () => {
    it("returns the string in dev mode", async () => {
      vi.stubEnv("NODE_ENV", "development");

      const res = errorResponse("Something went wrong");
      const body = await res.json();

      expect(body).toEqual({ error: "Something went wrong" });
    });

    it("returns a generic message in production mode", async () => {
      vi.stubEnv("NODE_ENV", "production");

      const res = errorResponse("Something went wrong");
      const body = await res.json();

      expect(body).toEqual({
        error: "An internal error occurred. Please try again later.",
      });
    });
  });

  it("respects a custom status code", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const res = errorResponse("Not found", 404);
    expect(res.status).toBe(404);
  });

  it("re-throws when the error is a Response instance", () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = new Response("Unauthorized", { status: 401 });

    expect(() => errorResponse(response)).toThrow();
  });

  describe("console.error", () => {
    it("is called in production mode", () => {
      vi.stubEnv("NODE_ENV", "production");
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      errorResponse("boom");

      expect(spy).toHaveBeenCalledOnce();
      spy.mockRestore();
    });

    it("is not called in dev mode", () => {
      vi.stubEnv("NODE_ENV", "development");
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      errorResponse("boom");

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("unknown error type", () => {
    it("shows stringified version in dev mode", async () => {
      vi.stubEnv("NODE_ENV", "development");

      const res = errorResponse(42);
      const body = await res.json();

      expect(body).toEqual({ error: "42" });
    });

    it("shows generic message in production mode", async () => {
      vi.stubEnv("NODE_ENV", "production");

      const res = errorResponse(42);
      const body = await res.json();

      expect(body).toEqual({
        error: "An internal error occurred. Please try again later.",
      });
    });
  });
});
