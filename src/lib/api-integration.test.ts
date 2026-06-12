/**
 * API Integration Tests.
 *
 * Tests the REST API against the running dev server (localhost:4000).
 * These are real HTTP tests — no mocking. Requires: npm run dev
 */
import { describe, it, expect, beforeAll } from "vitest";

const BASE = "http://localhost:4000";

let sessionCookie = "";
let csrfToken = "";

describe("API Integration", () => {
  const testIp = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

  beforeAll(async () => {
    // Login to get session cookie and CSRF token (use unique IP to avoid rate limiting)
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": testIp,
      },
      body: JSON.stringify({ slug: "demo-company", password: "demo" }),
    });
    expect(res.status).toBe(200);

    const setCookie = res.headers.getSetCookie();
    for (const cookie of setCookie) {
      if (cookie.startsWith("multiseo_session=")) {
        sessionCookie = cookie.split(";")[0];
      } else if (cookie.startsWith("multiseo_csrf=")) {
        csrfToken = cookie.split(";")[0].replace("multiseo_csrf=", "");
      }
    }
    expect(sessionCookie).toBeTruthy();
  });

  // === Auth ===
  describe("Auth", () => {
    it("login with wrong password returns 401", async () => {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": testIp,
        },
        body: JSON.stringify({ slug: "demo-company", password: "wrong" }),
      });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Credenciales inválidas");
    });

    it("login with empty body returns 400", async () => {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": testIp,
        },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });
  });

  // === Websites ===
  describe("Websites", () => {
    it("GET returns websites for tenant", async () => {
      const res = await fetch(`${BASE}/api/websites`, {
        headers: { Cookie: sessionCookie },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThan(0);
    });
  });

  // === Keywords ===
  describe("Keywords", () => {
    it("GET returns keywords for a website", async () => {
      const res = await fetch(`${BASE}/api/keywords?websiteId=1`, {
        headers: { Cookie: sessionCookie },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.keywords).toBeDefined();
    });
  });

  // === Dashboard ===
  describe("Dashboard", () => {
    it("GET returns KPIs", async () => {
      const res = await fetch(`${BASE}/api/dashboard?websiteId=1`, {
        headers: { Cookie: sessionCookie },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.kpis).toBeDefined();
    });
  });

  // === Competitors ===
  describe("Competitors", () => {
    it("GET returns competitor data", async () => {
      const res = await fetch(`${BASE}/api/competitors?websiteId=1`, {
        headers: { Cookie: sessionCookie },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.competitors).toBeDefined();
    });
  });

  // === Tenant Settings ===
  describe("Tenant Settings", () => {
    it("GET returns settings for own tenant", async () => {
      const res = await fetch(`${BASE}/api/tenants/demo/settings`, {
        headers: { Cookie: sessionCookie },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toBeDefined();
    });

    it("PATCH updates settings", async () => {
      const res = await fetch(`${BASE}/api/tenants/demo/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${sessionCookie}; multiseo_csrf=${csrfToken}`,
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ telegramChatId: "12345" }),
      });
      expect(res.status).toBe(200);
    });
  });

  // === Unauthenticated ===
  describe("Unauthenticated", () => {
    it("redirects to login HTML", async () => {
      const res = await fetch(`${BASE}/api/websites`);
      const text = await res.text();
      expect(text).toContain("<!DOCTYPE html>");
    });
  });
});
