import { test, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");
test.use({ storageState: authFile });

test.describe.serial("Navigation", () => {
  test("navigate to Rankings", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: "Rankings" }).click();
    await page.waitForURL("**/rankings", { timeout: 15_000 });
    await expect(page.locator("h1, h2, h3").first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("navigate to Settings", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: "Configuración" }).click();
    await page.waitForURL("**/settings", { timeout: 15_000 });
    await expect(page.locator("h1, h2, h3").first()).toBeVisible({
      timeout: 5_000,
    });
  });
});
