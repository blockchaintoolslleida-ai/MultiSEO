/**
 * One-time migration script: encrypts all plaintext secrets in the tenants table.
 *
 * Run manually with: npx tsx src/lib/migrate-encrypt-secrets.ts
 *
 * Requires ENCRYPTION_KEY environment variable to be set.
 * Safe to run multiple times — already-encrypted values are skipped.
 */
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isEncrypted, encrypt } from "./encryption";

const SECRET_FIELDS = [
  "deepseekApiKey",
  "gscRefreshToken",
  "gscAccessToken",
  "telegramBotToken",
  "telegramChatId",
  "geoProviderKeys",
] as const;

function main(): void {
  console.log("🔐 MultiSEO — Secret Encryption Migration");
  console.log("==========================================\n");

  if (!process.env.ENCRYPTION_KEY) {
    console.error("❌ ENCRYPTION_KEY environment variable is not set.");
    console.error("   Set it first: $env:ENCRYPTION_KEY = (openssl rand -hex 32)");
    process.exit(1);
  }

  const allTenants = db.select().from(tenants).all();
  console.log(`Found ${allTenants.length} tenant(s).\n`);

  let encrypted = 0;
  let skipped = 0;
  let errors = 0;

  for (const tenant of allTenants) {
    const updates: Record<string, string> = {};

    for (const field of SECRET_FIELDS) {
      const value = tenant[field] as string | null | undefined;
      if (!value) continue;

      if (isEncrypted(value)) {
        skipped++;
        continue;
      }

      try {
        updates[field] = encrypt(value);
        encrypted++;
      } catch (err) {
        console.error(
          `❌ Failed to encrypt ${field} for tenant "${tenant.name}":`,
          err instanceof Error ? err.message : err
        );
        errors++;
      }
    }

    if (Object.keys(updates).length > 0) {
      db.update(tenants)
        .set(updates)
        .where(eq(tenants.id, tenant.id))
        .run();
      console.log(`✅ Tenant "${tenant.name}": encrypted ${Object.keys(updates).length} field(s)`);
    }
  }

  console.log(`\nDone. ${encrypted} field(s) encrypted, ${skipped} already encrypted, ${errors} error(s).`);

  if (errors > 0) {
    process.exit(1);
  }
}

main();
