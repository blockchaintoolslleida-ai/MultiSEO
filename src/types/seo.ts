// === Shared types ===
export interface WebsiteOption {
  id: string;
  domain: string;
}

// === Dashboard SEO ===
export interface KPIMetric {
  value: number;
  change: number;
  trend: "up" | "down" | "flat";
}

export interface KPIData {
  avgPosition: KPIMetric;
  estimatedTraffic: KPIMetric;
  backlinks: KPIMetric;
  healthScore: KPIMetric;
}

export interface RankingPoint {
  date: string;
  avgPosition: number;
}

export interface CompetitorData {
  rank: number;
  domain: string;
  avgPosition: number;
  trend: "up" | "down" | "flat";
  highlightChange?: boolean;
}

export interface CompetitorFull extends CompetitorData {
  id: string;
  keywordsOverlap: string[];
  trafficEstimate: number;
  isManual: boolean;
  lastUpdated: string;
}

export interface CompetitorKPIs {
  totalCompetitors: number;
  yourAvgPosition: number;
  top3AvgPosition: number;
  overlappingKeywords: number;
  activeThreats: number;
}

export interface OverlapMatrixRow {
  keywordId: string;
  keyword: string;
  yourPosition: number;
  competitors: { domain: string; position: number }[];
}

export interface CompetitorRecommendation {
  type: "gap" | "threat" | "opportunity" | "new_competitor";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  actionLabel: string;
  relatedCompetitor?: string;
  relatedKeyword?: string;
}

export interface CompetitorsFullData {
  kpis: CompetitorKPIs;
  competitors: CompetitorFull[];
  overlapMatrix: OverlapMatrixRow[];
  recommendations: CompetitorRecommendation[];
}

export interface KeywordData {
  id: string;
  keyword: string;
  position: number;
  change: number;
  volume: number;
  difficulty: "easy" | "medium" | "hard";
  history: number[];
  isTop3?: boolean;
  isFalling?: boolean;
  websiteDomain?: string;
}

export interface SEODashboardData {
  websiteUrl: string;
  kpis: KPIData;
  rankingHistory: RankingPoint[];
  competitors: CompetitorData[];
  keywords: KeywordData[];
}

// === Websites ===
export type ConnectionStatus = "connected" | "no-access" | "error";
export type AccessType = "wordpress" | "ftp" | "ssh" | "cpanel";

export interface WebsiteData {
  id: string;
  domain: string;
  status: ConnectionStatus;
  accessTypes: AccessType[];
  keywords: number;
  articles: number;
  avgPosition: number;
  lastAudit: string;
  errorMessage?: string;
  gscSiteUrl?: string | null;
}

export interface WebsiteStats {
  total: number;
  connected: number;
  noAccess: number;
  error: number;
}

// === Articles ===
export type ArticleStatus = "published" | "draft" | "scheduled" | "generating";

export interface ArticleData {
  id: string;
  title: string;
  status: ArticleStatus;
  aiModel?: "claude" | "deepseek";
  websiteUrl: string;
  editedAt?: string;
  publishedAt?: string;
  scheduledAt?: string;
  keywords: string[];
  position?: number;
  views?: number;
  progress?: number;
  seoScores?: SEOScores;
  metaDescription?: string;
  slug?: string;
  content?: ArticleContent;
}

export interface ArticleContent {
  h2Sections: { title: string; paragraphs: string[] }[];
}

export interface SEOScores {
  keywords: number;
  readability: number;
  structure: number;
  originality: number;
}

// === Reports ===
export type ReportStatus = "sent" | "scheduled" | "draft";
export type ReportFrequency = "weekly" | "monthly" | "custom";

export interface ReportData {
  id: string;
  name: string;
  status: ReportStatus;
  frequency: ReportFrequency;
  websiteUrl: string;
  period: string;
  scheduleDescription?: string;
  scheduleEnabled: boolean;
  metrics: Record<string, string>;
  colorScheme: "indigo" | "green";
  shareUrl?: string;
  shareExpiresIn?: number;
}

export interface BrandingSettings {
  logoUrl: string | null;
  brandColor: string;
  footerText: string;
}

// === Layout ===
export interface NavItemData {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export interface NavSectionData {
  title: string;
  items: NavItemData[];
}

export interface NotificationData {
  id: string;
  message: string;
  type: "success" | "warning" | "error" | "info";
  time: string;
  read: boolean;
}
