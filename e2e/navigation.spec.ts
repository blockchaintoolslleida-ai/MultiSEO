import { test, expect } from "@playwright/test";
import { login } from "./auth-helper";

test.describe.serial("Navigation", () => {
  test("navigate to Rankings after login", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "Rankings" }).click();
    await page.waitForURL("**/rankings", { timeout: 15_000 });
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 5_000 });
  });

  test("navigate to Settings after login", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "Configuración" }).click();
    await page.waitForURL("**/settings", { timeout: 15_000 });
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 5_000 });
  });
});
