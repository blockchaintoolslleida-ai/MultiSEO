/**
 * Next.js Instrumentation Hook.
 *
 * Runs once at server startup. Validates that all required secrets
 * and environment variables are present before accepting requests.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
import { validateStartupSecrets } from "@/lib/startup-checks";

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Only run startup checks in Node.js runtime, not Edge
    const result = validateStartupSecrets();

    if (!result.ok) {
      console.error("╔══════════════════════════════════════════════╗");
      console.error("║  STARTUP CONFIGURATION ERRORS                ║");
      console.error("╠══════════════════════════════════════════════╣");
      for (const err of result.errors) {
        console.error(`║  ❌ ${err.substring(0, 44)}`);
      }
      console.error("╚══════════════════════════════════════════════╝");
      throw new Error(
        "Server startup aborted due to configuration errors. Fix the issues above and restart."
      );
    }

    if (result.warnings.length > 0) {
      console.warn("┌──────────────────────────────────────────────┐");
      console.warn("│  STARTUP WARNINGS                            │");
      console.warn("├──────────────────────────────────────────────┤");
      for (const warn of result.warnings) {
        console.warn(`│  ⚠️  ${warn.substring(0, 44)}`);
      }
      console.warn("└──────────────────────────────────────────────┘");
    }
  }
}
