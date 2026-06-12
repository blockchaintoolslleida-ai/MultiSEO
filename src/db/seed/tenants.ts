import { tenants } from "@/db/schema";
import { hashPassword } from "@/lib/auth-password";

export function seedTenants(tx: any): { demoId: string } {
  tx.insert(tenants).values([
    { id: "demo", name: "Demo Company", slug: "demo-company", passwordHash: hashPassword("demo"), createdAt: new Date().toISOString() },
    { id: "acme", name: "Acme Corp", slug: "acme-corp", passwordHash: hashPassword("acme"), createdAt: new Date().toISOString() },
  ]).run();
  return { demoId: "demo" };
}
