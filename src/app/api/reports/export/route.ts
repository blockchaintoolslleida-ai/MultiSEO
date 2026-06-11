import { db } from "@/db";
import { keywords } from "@/db/schema";
import { generateReportPDF, buildReportHTML } from "@/lib/pdf-export";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      websiteId,
      title = "SEO Report",
      brandColor = "#4f46e5",
      logoUrl,
      period = new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" }),
    } = body;

    if (!websiteId) {
      return Response.json({ error: "websiteId is required" }, { status: 400 });
    }

    // Get website keywords for the report
    const kwList = db.select().from(keywords).where(eq(keywords.websiteId, websiteId)).all();

    const avgPos =
      kwList.length > 0
        ? Math.round((kwList.reduce((s, k) => s + k.position, 0) / kwList.length) * 10) / 10
        : 0;
    const totalVolume = kwList.reduce((s, k) => s + k.volume, 0);
    const top3Count = kwList.filter((k) => k.position <= 3).length;

    const html = buildReportHTML({
      title,
      brandColor,
      websiteUrl: body.websiteUrl ?? "Website",
      period,
      logoUrl,
      kpis: [
        { label: "Posición Media", value: String(avgPos) },
        { label: "Keywords Top 3", value: String(top3Count) },
        { label: "Volumen Total", value: totalVolume.toLocaleString("es-ES") },
        { label: "Keywords", value: String(kwList.length) },
      ],
      keywords: kwList.map((k) => ({
        keyword: k.keyword,
        position: k.position,
        change: k.change,
        volume: k.volume,
      })),
    });

    const pdf = await generateReportPDF({
      html,
      footerText: `${title} — ${body.websiteUrl ?? ""}`,
      logoUrl,
      brandColor,
    });

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF export failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
