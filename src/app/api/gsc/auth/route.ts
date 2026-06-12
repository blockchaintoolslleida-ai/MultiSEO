import { getOAuthUrl } from "@/lib/google-search-console";
import { getTenantId } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return Response.json(
        { error: "GOOGLE_CLIENT_ID not configured. Set it in .env.local" },
        { status: 400 }
      );
    }

    const tenantId = getTenantId(request);

    const baseUrl = getOAuthUrl();
    const url = new URL(baseUrl);
    url.searchParams.set("state", tenantId);

    return Response.json({ data: { authUrl: url.toString() } });
  } catch (error) {
    if (error instanceof Response) throw error;
    const message = error instanceof Error ? error.message : "Failed to generate auth URL";
    return Response.json({ error: message }, { status: 500 });
  }
}
