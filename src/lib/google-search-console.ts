const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GSC_API_BASE = "https://www.googleapis.com/webmasters/v3";

export interface GSCSearchAnalyticsRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCSearchAnalyticsResponse {
  rows?: GSCSearchAnalyticsRow[];
  responseAggregationType?: string;
}

function getClientId(): string {
  return process.env.GOOGLE_CLIENT_ID ?? "";
}

function getClientSecret(): string {
  return process.env.GOOGLE_CLIENT_SECRET ?? "";
}

function getRedirectUri(): string {
  return process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:4000/api/gsc/callback";
}

export function getOAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    access_type: "offline",
    prompt: "consent",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string
): Promise<{ access_token: string; refresh_token: string }> {
  const body = new URLSearchParams({
    code,
    client_id: getClientId(),
    client_secret: getClientSecret(),
    redirect_uri: getRedirectUri(),
    grant_type: "authorization_code",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google OAuth error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string }> {
  const body = new URLSearchParams({
    client_id: getClientId(),
    client_secret: getClientSecret(),
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  return { access_token: data.access_token };
}

export async function getSearchAnalytics(
  accessToken: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
  rowLimit: number = 50
): Promise<GSCSearchAnalyticsRow[]> {
  const url = `${GSC_API_BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GSC API error ${res.status} for site "${siteUrl}": ${err}`);
  }

  const data: GSCSearchAnalyticsResponse = await res.json();
  return data.rows ?? [];
}

export async function listSites(accessToken: string): Promise<string[]> {
  const url = `${GSC_API_BASE}/sites`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GSC Sites API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (data.siteEntry ?? []).map((s: { siteUrl: string }) => s.siteUrl);
}
