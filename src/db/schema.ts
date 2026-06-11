import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  deepseekApiKey: text("deepseek_api_key"),
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
