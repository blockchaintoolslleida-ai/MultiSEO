import { test, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");
test.use({ storageState: authFile });

test.describe.serial("Settings", () => {
  test("settings page loads", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings/);

    // Wait for any content to render (heading or loading text)
    // NOTE: no networkidle — the page may poll in the background
    await expect(page.locator("h1, h2, h3, p").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("settings page has no runtime errors", async ({ page }) => {
    await page.goto("/settings");

    // Wait for content to render
    await expect(page.locator("h1, h2, h3, p").first()).toBeVisible({
      timeout: 15_000,
    });

    // The page should not show a Next.js error overlay
    const errorOverlay = page.locator("nextjs-portal");
    await expect(errorOverlay).not.toBeVisible({ timeout: 1_000 });
  });
});
