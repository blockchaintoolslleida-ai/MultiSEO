import { test, expect } from "@playwright/test";
import { login } from "./auth-helper";

test.describe.serial("Rankings", () => {
  test("load rankings page after login", async ({ page }) => {
    await login(page);
    await page.goto("/rankings");
    await expect(page).toHaveURL(/\/rankings/);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
  });

  test("rankings page has no runtime errors", async ({ page }) => {
    await login(page);
    await page.goto("/rankings");
    await page.waitForLoadState("networkidle");
    // Verify the page loaded without crashing (h1 should be present)
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
  });
});
