import { test, expect } from "@playwright/test";
import { login } from "./auth-helper";

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
  await expect(page.getByText("Credenciales inválidas")).toBeVisible({ timeout: 5_000 });
});

test("logout returns to login", async ({ page }) => {
  await login(page);
  // Dismiss Next.js dev overlay if present
  const overlay = page.locator("nextjs-portal");
  if (await overlay.isVisible({ timeout: 500 }).catch(() => false)) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  }
  const logoutBtn = page.getByRole("button", { name: "Cerrar Sesión" });
  await logoutBtn.click({ force: true });
  await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
});

test("CSRF: POST without token returns 403", async ({ request }) => {
  const res = await request.post("/api/auth/login", {
    data: { slug: "demo-company", password: "demo" }
  });
  // Login is actually a public route, so it won't be blocked by CSRF.
  // But POST to a protected route without CSRF token should fail:
  const res2 = await request.post("/api/gsc/disconnect", {
    data: {}
  });
  expect(res2.status()).toBe(403);
});
