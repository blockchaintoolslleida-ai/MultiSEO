import { db } from "@/db";
import { geoQueries, geoResults, websites, tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getGEOProviders } from "@/lib/geo/providers/factory";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { websiteId } = body;

    if (!websiteId) {
      return Response.json({ error: "websiteId is required" }, { status: 400 });
    }

    // Get website + tenant
    const website = db
      .select()
      .from(websites)
      .where(eq(websites.id, websiteId))
      .get();
    if (!website) {
      return Response.json({ error: "Website not found" }, { status: 404 });
    }

    const tenant = db
      .select()
      .from(tenants)
      .where(eq(tenants.id, website.tenantId))
      .get();
    if (!tenant) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Get providers
    const providers = getGEOProviders(tenant);
    if (providers.length === 0) {
      return Response.json(
        { error: "No GEO providers configured. Add API keys in settings." },
        { status: 400 }
      );
    }

    // Get enabled queries
    const queries = db
      .select()
      .from(geoQueries)
      .where(eq(geoQueries.websiteId, websiteId))
      .all()
      .filter((q) => q.enabled === 1);

    if (queries.length === 0) {
      return Response.json(
        { error: "No active GEO queries found for this website" },
        { status: 400 }
      );
    }

    let brandMentions = 0;
    let totalSentiment = 0;
    let sentimentCount = 0;

    // Use same timestamp for all results in this scan batch
    const scanTimestamp = new Date().toISOString();

    for (const gq of queries) {
      for (const provider of providers) {
        try {
          const result = await provider.query({
            query: gq.query,
            targetBrand: website.domain,
            competitorBrands: [],
          });

          const id = crypto.randomUUID();

          db.insert(geoResults)
            .values({
              id,
              websiteId,
              queryId: gq.id,
              provider: provider.id,
              brandMentioned: result.brandMentioned ? 1 : 0,
              mentionPosition: result.mentionPosition,
              sentiment: result.sentiment,
              snippet: result.snippet,
              competitorsMentioned: JSON.stringify(result.competitorsMentioned),
              responseFull: result.fullResponse,
              scannedAt: scanTimestamp,
            })
            .run();

          if (result.brandMentioned) brandMentions++;

          const sentimentScore =
            result.sentiment === "positive"
              ? 1
              : result.sentiment === "negative"
                ? -1
                : 0;
          totalSentiment += sentimentScore;
          sentimentCount++;

          // Rate limiting between calls
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (err) {
          console.error(
            `GEO scan failed for query "${gq.query}" with provider ${provider.id}:`,
            err
          );
          // Continue with other queries
        }
      }
    }

    const avgSentiment =
      sentimentCount > 0
        ? totalSentiment > 0
          ? "positive"
          : totalSentiment < 0
            ? "negative"
            : "neutral"
        : "neutral";

    return Response.json({
      data: {
        queriesScanned: queries.length,
        providersUsed: providers.map((p) => p.id),
        brandMentions,
        avgSentiment,
        totalQueries: queries.length * providers.length,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Scan failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
