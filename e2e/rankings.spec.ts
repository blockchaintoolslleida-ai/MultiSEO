import { test, expect } from "@playwright/test";
import { login } from "./auth-helper";

test.describe.serial("Rankings", () => {
  test("login and load rankings", async ({ page }) => {
    await login(page);
    await page.goto("/rankings");
    await page.waitForURL("**/rankings");
    await page.waitForLoadState("networkidle");
  });

  test("shows heading", async ({ page }) => {
    await page.goto("/rankings");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10_000 });
  });
});
