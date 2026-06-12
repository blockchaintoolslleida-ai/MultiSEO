/**
 * HTML utilities for MultiSEO.
 *
 * Server-side HTML escaping for data inserted into server-rendered HTML
 * (GSC callback, PDF export, Telegram messages).
 */

const ENTITY_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

/** Escape a string for safe insertion into HTML text content or attributes. */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => ENTITY_MAP[ch] || ch);
}
