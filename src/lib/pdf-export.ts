import { chromium } from "playwright";
import { escapeHtml } from "./html";

export interface PDFExportOptions {
  html: string;
  landscape?: boolean;
  footerText?: string;
  logoUrl?: string;
  brandColor?: string;
}

export async function generateReportPDF(options: PDFExportOptions): Promise<Buffer> {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    await page.setContent(options.html, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const pdf = await page.pdf({
      format: "A4",
      landscape: options.landscape ?? false,
      printBackground: true,
      margin: { top: "15mm", bottom: "20mm", left: "12mm", right: "12mm" },
      displayHeaderFooter: true,
      headerTemplate: options.logoUrl
        ? `<div style="text-align:right;padding-right:12mm;font-size:8px;color:#9ca3af;width:100%"><img src="${options.logoUrl}" style="max-height:24px" /></div>`
        : "",
      footerTemplate: `<div style="text-align:center;font-size:8px;color:#9ca3af;width:100%;border-top:1px solid #e5e7eb;padding-top:4px">${options.footerText || "MultiSEO Report"} — Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>`,
    });

    return pdf;
  } finally {
    await browser.close();
  }
}

export function buildReportHTML(data: {
  title: string;
  brandColor: string;
  websiteUrl: string;
  period: string;
  kpis: { label: string; value: string }[];
  keywords: { keyword: string; position: number; change: number; volume: number }[];
  logoUrl?: string;
  websites?: { domain: string; kpis: { label: string; value: string }[] }[];
}): string {
  const color = data.brandColor || "#4f46e5";

  const websitesHtml = data.websites?.length
    ? `
  <div class="section">
    <h2>Desglose por Sitio Web</h2>
    ${data.websites
      .map(
        (w) => `
    <h3 style="font-size:16px;color:#374151;margin-bottom:10px;margin-top:16px;">${escapeHtml(w.domain)}</h3>
    <div class="kpi-grid">
      ${w.kpis.map((k) => `<div class="kpi-card"><div class="value">${escapeHtml(k.value)}</div><div class="label">${escapeHtml(k.label)}</div></div>`).join("")}
    </div>
    `
      )
      .join("")}
  </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>${escapeHtml(data.title)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; color: #1f2937; padding: 0; }
  .cover { background: ${color}; color: white; padding: 60px 50px; text-align: center; page-break-after: always; }
  .cover h1 { font-size: 32px; margin-bottom: 12px; }
  .cover p { font-size: 16px; opacity: 0.85; }
  .cover .url { font-size: 20px; margin-bottom: 8px; }
  .section { padding: 30px 40px; }
  .section h2 { font-size: 20px; color: ${color}; margin-bottom: 16px; border-bottom: 2px solid ${color}; padding-bottom: 8px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .kpi-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; }
  .kpi-card .value { font-size: 28px; font-weight: 700; color: ${color}; }
  .kpi-card .label { font-size: 12px; color: #6b7280; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 10px 12px; background: #f3f4f6; color: #4b5563; font-weight: 600; border-bottom: 2px solid #d1d5db; }
  td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
  .pos-up { color: #16a34a; }
  .pos-down { color: #dc2626; }
  .footer-note { text-align: center; color: #9ca3af; font-size: 11px; padding-top: 20px; border-top: 1px solid #e5e7eb; margin-top: 30px; }
</style></head>
<body>
  <div class="cover">
    <p class="url">${escapeHtml(data.websiteUrl)}</p>
    <h1>${escapeHtml(data.title)}</h1>
    <p>${escapeHtml(data.period)}</p>
  </div>
  <div class="section">
    <h2>Resumen de KPIs</h2>
    <div class="kpi-grid">
      ${data.kpis.map((k) => `<div class="kpi-card"><div class="value">${escapeHtml(k.value)}</div><div class="label">${escapeHtml(k.label)}</div></div>`).join("")}
    </div>
  </div>${websitesHtml}
  <div class="section">
    <h2>Ranking de Keywords</h2>
    <table>
      <thead><tr><th>Keyword</th><th>Posición</th><th>Cambio</th><th>Volumen</th></tr></thead>
      <tbody>
        ${data.keywords
          .map(
            (k) => `<tr>
          <td>${escapeHtml(k.keyword)}</td>
          <td>${k.position}</td>
          <td class="${k.change > 0 ? "pos-down" : "pos-up"}">${k.change > 0 ? "+" + k.change : k.change}</td>
          <td>${k.volume.toLocaleString("es-ES")}</td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </div>
  <div class="footer-note">Generado por MultiSEO — ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</div>
</body></html>`;
}
