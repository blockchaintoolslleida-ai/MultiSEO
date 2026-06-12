/**
 * MultiSEO database seed entry point.
 *
 * Populates a fresh SQLite database with demo data across all entities.
 * Usage: npx tsx src/db/seed.ts
 *
 * The seeding logic is split into domain-specific modules under src/db/seed/.
 */
import { seed } from "./seed/index";

seed();
