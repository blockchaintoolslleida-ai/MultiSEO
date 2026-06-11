import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  deepseekApiKey: text("deepseek_api_key"),
  gscRefreshToken: text("gsc_refresh_token"),
  gscAccessToken: text("gsc_access_token"),
  gscSiteUrl: text("gsc_site_url"),
  gscConnected: integer("gsc_connected").notNull().default(0),
  passwordHash: text("password_hash"),
  telegramBotToken: text("telegram_bot_token"),
  telegramChatId: text("telegram_chat_id"),
  geoProviderKeys: text("geo_provider_keys"),
  geoEnabledProviders: text("geo_enabled_providers"),
  createdAt: text("created_at").notNull().default(""),
});

export const websites = sqliteTable("websites", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  domain: text("domain").notNull().unique(),
  status: text("status").notNull().default("connected"),
  accessTypes: text("access_types").notNull().default("[]"),
  keywordsCount: integer("keywords_count").notNull().default(0),
  articlesCount: integer("articles_count").notNull().default(0),
  avgPosition: real("avg_position").notNull().default(0),
  estimatedTraffic: integer("estimated_traffic").notNull().default(0),
  backlinksCount: integer("backlinks_count").notNull().default(0),
  healthScore: integer("health_score").notNull().default(0),
  lastAudit: text("last_audit").notNull().default(""),
  lastGscSync: text("last_gsc_sync"),
  errorMessage: text("error_message"),
  createdAt: text("created_at").notNull().default(""),
});

export const keywords = sqliteTable("keywords", {
  id: text("id").primaryKey(),
  websiteId: text("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  position: integer("position").notNull(),
  change: integer("change").notNull().default(0),
  volume: integer("volume").notNull().default(0),
  difficulty: text("difficulty").notNull().default("medium"),
  history: text("history").notNull().default("[]"),
  isTop3: integer("is_top3").notNull().default(0),
  isFalling: integer("is_falling").notNull().default(0),
});

export const competitors = sqliteTable("competitors", {
  id: text("id").primaryKey(),
  websiteId: text("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  rank: integer("rank").notNull(),
  domain: text("domain").notNull(),
  avgPosition: real("avg_position").notNull(),
  trend: text("trend").notNull().default("flat"),
  highlightChange: integer("highlight_change").notNull().default(0),
  keywordsOverlap: text("keywords_overlap").notNull().default("[]"),
  trafficEstimate: integer("traffic_estimate").notNull().default(0),
  isManual: integer("is_manual").notNull().default(0),
  lastUpdated: text("last_updated").notNull().default(""),
});

export const rankingHistory = sqliteTable("ranking_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  websiteId: text("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  avgPosition: real("avg_position").notNull(),
});

export const articles = sqliteTable("articles", {
  id: text("id").primaryKey(),
  websiteId: text("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: text("status").notNull().default("draft"),
  aiModel: text("ai_model"),
  keywords: text("keywords").notNull().default("[]"),
  position: integer("position"),
  views: integer("views"),
  progress: integer("progress"),
  seoScores: text("seo_scores"),
  metaDescription: text("meta_description"),
  slug: text("slug"),
  content: text("content"),
  editedAt: text("edited_at"),
  publishedAt: text("published_at"),
  scheduledAt: text("scheduled_at"),
  createdAt: text("created_at").notNull().default(""),
});

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  websiteId: text("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull().default("draft"),
  frequency: text("frequency").notNull().default("monthly"),
  period: text("period").notNull().default(""),
  scheduleDescription: text("schedule_description"),
  scheduleEnabled: integer("schedule_enabled").notNull().default(0),
  metrics: text("metrics").notNull().default("{}"),
  colorScheme: text("color_scheme").notNull().default("indigo"),
  shareUrl: text("share_url"),
  shareExpiresIn: integer("share_expires_in"),
  createdAt: text("created_at").notNull().default(""),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  time: text("time").notNull().default(""),
  read: integer("read").notNull().default(0),
  createdAt: text("created_at").notNull().default(""),
});

export const geoQueries = sqliteTable("geo_queries", {
  id: text("id").primaryKey(),
  websiteId: text("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  query: text("query").notNull(),
  source: text("source").notNull().default("seo"),
  enabled: integer("enabled").notNull().default(1),
  createdAt: text("created_at").notNull().default(""),
});

export const geoResults = sqliteTable("geo_results", {
  id: text("id").primaryKey(),
  websiteId: text("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  queryId: text("query_id").notNull().references(() => geoQueries.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  brandMentioned: integer("brand_mentioned").notNull().default(0),
  mentionPosition: integer("mention_position"),
  sentiment: text("sentiment").notNull().default("neutral"),
  snippet: text("snippet"),
  competitorsMentioned: text("competitors_mentioned").notNull().default("[]"),
  responseFull: text("response_full"),
  scannedAt: text("scanned_at").notNull().default(""),
});
