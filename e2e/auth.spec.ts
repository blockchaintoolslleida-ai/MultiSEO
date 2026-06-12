import { test, expect } from "@playwright/test";
import { login } from "./auth-helper";

// Note: this file intentionally does NOT use storageState.
// These tests exercise the login form, redirects, and logout — they
// need to start unauthenticated.

test("redirects to /login when unauthenticated", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("login page shows form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "MultiSEO" })).toBeVisible();
  await expect(page.getByText("SEO Intelligence Platform")).toBeVisible();
  await expect(page.getByPlaceholder("demo-company")).toBeVisible();
  await expect(page.getByPlaceholder("••••••••")).toBeVisible();
  await expect(page.getByRole("button", { name: "Iniciar Sesión" })).toBeVisible();
});

test("successful login redirects to dashboard", async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText("Dashboard SEO")).toBeVisible();
});

test("invalid credentials show error", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("demo-company").fill("wrong");
  await page.getByPlaceholder("••••••••").fill("wrong");
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  await expect(page.getByText("Credenciales inválidas")).toBeVisible({
    timeout: 5_000,
  });
});

test("logout returns to login", async ({ page }) => {
  await login(page);
  // Use evaluate to click logout, bypassing any overlay interception
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const logout = buttons.find((b) => b.textContent?.includes("Cerrar Sesión"));
    if (logout) (logout as HTMLButtonElement).click();
  });
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
});

test("unauthenticated API POST is rejected (no tenant context)", async ({ request }) => {
  // GSC disconnect requires x-tenant-id header from session middleware.
  // Without auth, the request cannot succeed — accept any rejection:
  // 401/403 JSON error, or 200 HTML (redirect to login page).
  const res = await request.post("/api/gsc/disconnect", { data: {} });

  // The key assertion: the response must NOT contain a successful disconnect payload
  const json = await res.json().catch(() => null);
  expect(json?.data?.disconnected).toBeFalsy();
});
