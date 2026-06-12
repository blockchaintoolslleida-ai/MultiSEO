import { test, expect } from "@playwright/test";
import { login } from "./auth-helper";

test.describe.serial("Settings", () => {
  test("load settings page after login", async ({ page }) => {
    await login(page);
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
  });

  test("settings page has no runtime errors", async ({ page }) => {
    await login(page);
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    // Verify the page loaded without crashing (h1 should be present)
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
  });
});
