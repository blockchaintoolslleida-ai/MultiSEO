import { test, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");
test.use({ storageState: authFile });

test.describe.serial("Settings", () => {
  test("settings page loads", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings/);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2, h3").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("settings page has no runtime errors", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // The page should not show a Next.js error overlay
    const errorOverlay = page.locator("nextjs-portal");
    await expect(errorOverlay).not.toBeVisible({ timeout: 3_000 });

    // A heading should be present
    await expect(page.locator("h1, h2, h3").first()).toBeVisible({
      timeout: 5_000,
    });
  });
});
