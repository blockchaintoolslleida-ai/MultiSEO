/**
 * Smoke tests for html.ts — validates escapeHtml and confirms Vitest works.
 */
import { describe, it, expect } from "vitest";
import { escapeHtml } from "./html";

describe("escapeHtml", () => {
  it("returns the same string when there is nothing to escape", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World");
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes less-than and greater-than", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes double and single quotes", () => {
    expect(escapeHtml(`"hello"`)).toBe("&quot;hello&quot;");
    expect(escapeHtml("'world'")).toBe("&#x27;world&#x27;");
  });

  it("escapes all special characters at once", () => {
    expect(escapeHtml(`<a href="x" onclick='alert(1)'>click & win</a>`)).toBe(
      "&lt;a href=&quot;x&quot; onclick=&#x27;alert(1)&#x27;&gt;click &amp; win&lt;/a&gt;"
    );
  });

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("handles strings with no special characters unchanged", () => {
    const safe = "Hello world 123 !@#$%^*()+-=[]{}|;:,./?";
    expect(escapeHtml(safe)).toBe(safe);
  });

  it("passes through Unicode characters without escaping", () => {
    expect(escapeHtml("café ñoño 中文 θω © §")).toBe("café ñoño 中文 θω © §");
  });

  it("does not double-escape already-escaped entities", () => {
    expect(escapeHtml("&amp;")).toBe("&amp;amp;");
  });

  it("escapes adjacent special characters", () => {
    expect(escapeHtml(`"><&`)).toBe("&quot;&gt;&lt;&amp;");
  });

  it("handles long strings with mixed safe and unsafe characters", () => {
    const input = `<div class="main">Hello & welcome to 'MultiSEO'</div>`;
    const expected =
      "&lt;div class=&quot;main&quot;&gt;Hello &amp; welcome to &#x27;MultiSEO&#x27;&lt;/div&gt;";
    expect(escapeHtml(input)).toBe(expected);
  });

  it("leaves newlines and tabs unchanged", () => {
    expect(escapeHtml("line1\nline2\tindented")).toBe("line1\nline2\tindented");
  });
});
