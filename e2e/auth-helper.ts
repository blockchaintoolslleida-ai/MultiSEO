import { Page } from "@playwright/test";

const TEST_USER = { slug: "demo-company", password: "demo" };

/**
 * Dismiss the Next.js dev error overlay if it is visible.
 * The overlay intercepts clicks and breaks UI automation.
 */
async function dismissDevOverlay(page: Page): Promise<void> {
  const overlay = page.locator("nextjs-portal");
  try {
    if (await overlay.isVisible({ timeout: 500 })) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
  } catch {
    // overlay not present — nothing to do
  }
}

/**
 * Log in via the UI. Navigates to /login, fills credentials, and waits for
 * the dashboard URL (proven most reliable across test runs).
 */
export async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await dismissDevOverlay(page);
  await page.getByPlaceholder("demo-company").fill(TEST_USER.slug);
  await page.getByPlaceholder("••••••••").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  await dismissDevOverlay(page);
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
  // Allow the dashboard to hydrate and dismiss any post-navigation overlay
  await page.waitForTimeout(500);
  await dismissDevOverlay(page);
}

export { TEST_USER };
