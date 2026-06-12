import { test, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");
test.use({ storageState: authFile });

test.describe.serial("Dashboard", () => {
  test("dashboard loads without errors", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForLoadState("networkidle");

    // At least one heading-level element should be visible
    const heading = page.locator("h1, h2, h3").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("dashboard has sidebar navigation", async ({ page }) => {
    await page.goto("/dashboard");

    // The sidebar should be present with main nav links
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByRole("link", { name: "Rankings" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Configuración" })).toBeVisible();
  });
});
