import { Page } from "@playwright/test";

const TEST_USER = { slug: "demo-company", password: "demo" };

/**
 * Log in via the UI. Navigates to /login, fills credentials, and waits for
 * the dashboard URL (proven most reliable across test runs).
 */
export async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByPlaceholder("demo-company").fill(TEST_USER.slug);
  await page.getByPlaceholder("••••••••").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}

export { TEST_USER };
