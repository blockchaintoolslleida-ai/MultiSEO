import { test, expect } from "@playwright/test";
import { login } from "./auth-helper";

test.describe.serial("Dashboard", () => {
  test("login and load dashboard", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
  });

  test("navigating directly to dashboard loads heading", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
  });
});
