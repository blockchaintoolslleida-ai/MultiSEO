/**
 * Unit tests for utils.ts — validates the cn() classname utility.
 */
import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("returns a single string class unchanged", () => {
    const result = cn("bg-red-500");

    expect(result).toBe("bg-red-500");
  });

  it("joins multiple strings with spaces", () => {
    const result = cn("bg-red-500", "text-white");

    expect(result).toBe("bg-red-500 text-white");
  });

  it("filters conditional object: truthy values included, falsy excluded", () => {
    const result = cn({ "text-red": true, "text-blue": false });

    expect(result).toBe("text-red");
  });

  it("filters out falsy values like null, undefined, and false", () => {
    const result = cn("text-lg", null, undefined, false, "font-bold");

    expect(result).toBe("text-lg font-bold");
  });

  it("flattens arrays of classes", () => {
    const result = cn(["bg-red-500", "text-white"]);

    expect(result).toBe("bg-red-500 text-white");
  });

  it("handles mixed inputs: strings, objects, and arrays", () => {
    const result = cn("p-4", { "m-2": true, "m-4": false }, ["text-lg"]);

    expect(result).toBe("p-4 m-2 text-lg");
  });

  it("uses twMerge deduplication: last Tailwind class wins", () => {
    const result = cn("px-4", "px-2");

    expect(result).toBe("px-2");
  });

  it("returns an empty string for empty input", () => {
    const result = cn("");

    expect(result).toBe("");
  });

  it("returns an empty string for no arguments", () => {
    const result = cn();

    expect(result).toBe("");
  });

  it("works with multiple truthy conditions", () => {
    const isActive = true;
    const isDisabled = true;

    const result = cn("base", { active: isActive, disabled: isDisabled });

    expect(result).toContain("base");
    expect(result).toContain("active");
    expect(result).toContain("disabled");
  });
});
