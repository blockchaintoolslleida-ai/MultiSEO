import { test, expect } from "@playwright/test";
import { login } from "./auth-helper";

test.describe.serial("Navigation", () => {
  test("login once", async ({ page, context }) => {
    await context.clearCookies();
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForLoadState("networkidle");
  });

  test("navigate to Rankings", async ({ page }) => {
    await page.getByRole("link", { name: "Rankings" }).click();
    await page.waitForURL("**/rankings", { timeout: 10_000 });
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("navigate to Settings", async ({ page }) => {
    await page.getByRole("link", { name: "Configuración" }).click();
    await page.waitForURL("**/settings", { timeout: 10_000 });
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
