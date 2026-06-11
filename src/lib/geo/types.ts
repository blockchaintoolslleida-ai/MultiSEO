export interface GEOProviderConfig {
  apiKey: string;
  model?: string;
}

export interface GEOQueryRequest {
  query: string;
  targetBrand: string;
  competitorBrands: string[];
}

export interface GEOResponse {
  brandMentioned: boolean;
  mentionPosition: number | null;
  sentiment: "positive" | "negative" | "neutral";
  snippet: string;
  competitorsMentioned: string[];
  fullResponse: string;
}

export interface GEOProvider {
  id: string;
  name: string;
  query(request: GEOQueryRequest): Promise<GEOResponse>;
  isAvailable(): Promise<boolean>;
}

export interface GEOKPI {
  visibility: { value: number; change: number; trend: "up" | "down" | "flat" };
  brandMentions: { value: number; change: number; trend: "up" | "down" | "flat" };
  avgSentiment: string;
  shareOfVoice: { value: number; change: number; trend: "up" | "down" | "flat" };
  activeQueries: { value: number };
}

export interface GEOQueryResult {
  queryId: string;
  query: string;
  keyword: string;
  brandMentioned: boolean;
  snippet: string;
  sentiment: string;
  provider: string;
}

export interface GEORecommendation {
  type: "content" | "backlinks" | "technical";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface ShareOfVoiceItem {
  domain: string;
  mentions: number;
  percentage: number;
  isTarget: boolean;
}
