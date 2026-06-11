import Database from "better-sqlite3";
import * as path from "path";

const DB_PATH = path.resolve(process.cwd(), "multiseo.db");
const sqlite = new Database(DB_PATH);

try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      deepseek_api_key TEXT,
      created_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS websites (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      domain TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'connected',
      access_types TEXT NOT NULL DEFAULT '[]',
      keywords_count INTEGER NOT NULL DEFAULT 0,
      articles_count INTEGER NOT NULL DEFAULT 0,
      avg_position REAL NOT NULL DEFAULT 0,
      estimated_traffic INTEGER NOT NULL DEFAULT 0,
      backlinks_count INTEGER NOT NULL DEFAULT 0,
      health_score INTEGER NOT NULL DEFAULT 0,
      last_audit TEXT NOT NULL DEFAULT '',
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS keywords (
      id TEXT PRIMARY KEY,
      website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
      keyword TEXT NOT NULL,
      position INTEGER NOT NULL,
      change INTEGER NOT NULL DEFAULT 0,
      volume INTEGER NOT NULL DEFAULT 0,
      difficulty TEXT NOT NULL DEFAULT 'medium',
      history TEXT NOT NULL DEFAULT '[]',
      is_top3 INTEGER NOT NULL DEFAULT 0,
      is_falling INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS competitors (
      id TEXT PRIMARY KEY,
      website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
      rank INTEGER NOT NULL,
      domain TEXT NOT NULL,
      avg_position REAL NOT NULL,
      trend TEXT NOT NULL DEFAULT 'flat',
      highlight_change INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ranking_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      avg_position REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      ai_model TEXT,
      keywords TEXT NOT NULL DEFAULT '[]',
      position INTEGER,
      views INTEGER,
      progress INTEGER,
      seo_scores TEXT,
      meta_description TEXT,
      slug TEXT,
      content TEXT,
      edited_at TEXT,
      published_at TEXT,
      scheduled_at TEXT,
      created_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      frequency TEXT NOT NULL DEFAULT 'monthly',
      period TEXT NOT NULL DEFAULT '',
      schedule_description TEXT,
      schedule_enabled INTEGER NOT NULL DEFAULT 0,
      metrics TEXT NOT NULL DEFAULT '{}',
      color_scheme TEXT NOT NULL DEFAULT 'indigo',
      share_url TEXT,
      share_expires_in INTEGER,
      created_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      time TEXT NOT NULL DEFAULT '',
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT ''
    );
  `);

  // GSC columns (add if not exist — SQLite doesn't support IF NOT EXISTS for ALTER)
  const tenantCols = (sqlite.pragma("table_info(tenants)") as any[]).map((c: any) => c.name);
  if (!tenantCols.includes("gsc_refresh_token")) {
    sqlite.exec("ALTER TABLE tenants ADD COLUMN gsc_refresh_token TEXT");
  }
  if (!tenantCols.includes("gsc_access_token")) {
    sqlite.exec("ALTER TABLE tenants ADD COLUMN gsc_access_token TEXT");
  }
  if (!tenantCols.includes("gsc_site_url")) {
    sqlite.exec("ALTER TABLE tenants ADD COLUMN gsc_site_url TEXT");
  }
  if (!tenantCols.includes("gsc_connected")) {
    sqlite.exec("ALTER TABLE tenants ADD COLUMN gsc_connected INTEGER NOT NULL DEFAULT 0");
  }
  if (!tenantCols.includes("telegram_bot_token")) {
    sqlite.exec("ALTER TABLE tenants ADD COLUMN telegram_bot_token TEXT");
  }
  if (!tenantCols.includes("telegram_chat_id")) {
    sqlite.exec("ALTER TABLE tenants ADD COLUMN telegram_chat_id TEXT");
  }
  if (!tenantCols.includes("geo_provider_keys")) {
    sqlite.exec("ALTER TABLE tenants ADD COLUMN geo_provider_keys TEXT");
  }
  if (!tenantCols.includes("geo_enabled_providers")) {
    sqlite.exec("ALTER TABLE tenants ADD COLUMN geo_enabled_providers TEXT");
  }

  // Competitors new columns
  const compCols = (sqlite.pragma("table_info(competitors)") as any[]).map((c: any) => c.name);
  if (!compCols.includes("keywords_overlap")) {
    sqlite.exec("ALTER TABLE competitors ADD COLUMN keywords_overlap TEXT NOT NULL DEFAULT '[]'");
  }
  if (!compCols.includes("traffic_estimate")) {
    sqlite.exec("ALTER TABLE competitors ADD COLUMN traffic_estimate INTEGER NOT NULL DEFAULT 0");
  }
  if (!compCols.includes("is_manual")) {
    sqlite.exec("ALTER TABLE competitors ADD COLUMN is_manual INTEGER NOT NULL DEFAULT 0");
  }
  if (!compCols.includes("last_updated")) {
    sqlite.exec("ALTER TABLE competitors ADD COLUMN last_updated TEXT NOT NULL DEFAULT ''");
  }

  // Websites — last_gsc_sync
  const webCols = (sqlite.pragma("table_info(websites)") as any[]).map((c: any) => c.name);
  if (!webCols.includes("last_gsc_sync")) {
    sqlite.exec("ALTER TABLE websites ADD COLUMN last_gsc_sync TEXT");
  }

  // GEO tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS geo_queries (
      id TEXT PRIMARY KEY,
      website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
      keyword TEXT NOT NULL,
      query TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'seo',
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS geo_results (
      id TEXT PRIMARY KEY,
      website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
      query_id TEXT NOT NULL REFERENCES geo_queries(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      brand_mentioned INTEGER NOT NULL DEFAULT 0,
      mention_position INTEGER,
      sentiment TEXT NOT NULL DEFAULT 'neutral',
      snippet TEXT,
      competitors_mentioned TEXT NOT NULL DEFAULT '[]',
      response_full TEXT,
      scanned_at TEXT NOT NULL DEFAULT ''
    );
  `);

  console.log("Tables created successfully");
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
} finally {
  sqlite.close();
}
