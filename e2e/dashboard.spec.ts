import { test, expect } from "@playwright/test";
import { login } from "./auth-helper";

test.describe.serial("Dashboard", () => {
  test("login and load dashboard", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForLoadState("networkidle");
  });

  test("shows main heading", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
  });
});
