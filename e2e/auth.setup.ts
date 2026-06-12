import { test as setup } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  // Navigate to login page to establish domain context
  await page.goto("/login");

  // Dismiss Next.js dev overlay if present
  try {
    const overlay = page.locator("nextjs-portal");
    if (await overlay.isVisible({ timeout: 500 })) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
  } catch {
    // overlay not present
  }

  // Login via browser fetch — cookies (session + CSRF) are set automatically
  await page.evaluate(async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: "demo-company", password: "demo" }),
    });
    if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  });

  // Navigate to dashboard to verify auth is working (proxy allows access)
  await page.goto("/dashboard");
  await page.waitForURL("**/dashboard", { timeout: 15_000 });

  // Allow the dashboard page to start rendering
  await page.waitForTimeout(2000);

  // Save authenticated browser state (session + CSRF cookies)
  await page.context().storageState({ path: authFile });
});
