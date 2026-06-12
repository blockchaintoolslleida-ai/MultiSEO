import { db } from "@/db";
import { keywords, websites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId, verifyWebsiteOwnership } from "@/lib/tenant";

export async function GET(request: Request) {
  const tenantId = getTenantId(request);

  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get("websiteId");
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "position";
    const order = searchParams.get("order") || "asc";
    const difficulty = searchParams.get("difficulty") || "";
    const page = parseInt(searchParams.get("page") || "0");
    const perPage = parseInt(searchParams.get("perPage") || "20");

    if (!websiteId) {
      return Response.json({ error: "websiteId is required" }, { status: 400 });
    }

    verifyWebsiteOwnership(websiteId, tenantId);

    // Fetch all keywords for this website
    const all = db
      .select()
      .from(keywords)
      .where(eq(keywords.websiteId, websiteId))
      .all();

    // Apply filters in-memory (SQLite is local, perf is fine)
    let filtered = all;
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter((k) => k.keyword.toLowerCase().includes(lower));
    }
    if (difficulty) {
      filtered = filtered.filter((k) => k.difficulty === difficulty);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sort) {
        case "position": cmp = a.position - b.position; break;
        case "volume": cmp = a.volume - b.volume; break;
        case "keyword": cmp = a.keyword.localeCompare(b.keyword); break;
        case "change": cmp = a.change - b.change; break;
        default: cmp = a.position - b.position;
      }
      return order === "desc" ? -cmp : cmp;
    });

    // Paginate
    const total = sorted.length;
    const paged = sorted.slice(page * perPage, (page + 1) * perPage);

    // Enrich with parsed history
    const enriched = paged.map((k) => ({
      ...k,
      history: (() => { try { return JSON.parse(k.history); } catch { return []; } })(),
      isTop3: k.isTop3 === 1,
      isFalling: k.isFalling === 1,
    }));

    // Get website domain
    const website = db.select().from(websites).where(eq(websites.id, websiteId)).get();

    return Response.json({
      data: {
        keywords: enriched,
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
        websiteDomain: website?.domain ?? "",
        summary: {
          total: all.length,
          easy: all.filter((k) => k.difficulty === "easy").length,
          medium: all.filter((k) => k.difficulty === "medium").length,
          hard: all.filter((k) => k.difficulty === "hard").length,
          top3: all.filter((k) => k.isTop3 === 1).length,
          falling: all.filter((k) => k.isFalling === 1).length,
          avgPosition: all.length > 0
            ? Math.round((all.reduce((s, k) => s + k.position, 0) / all.length) * 10) / 10
            : 0,
        },
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    const message = error instanceof Error ? error.message : "Failed to fetch keywords";
    return Response.json({ error: message }, { status: 500 });
  }
}
