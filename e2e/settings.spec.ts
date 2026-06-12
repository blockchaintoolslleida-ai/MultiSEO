import { test, expect } from "@playwright/test";
import { login } from "./auth-helper";

test.describe.serial("Settings", () => {
  test("login and load settings", async ({ page }) => {
    await login(page);
    await page.goto("/settings");
    await page.waitForURL("**/settings");
    await page.waitForLoadState("networkidle");
  });

  test("shows heading", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
  });
});
