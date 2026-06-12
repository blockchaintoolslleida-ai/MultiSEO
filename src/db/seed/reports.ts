import { reports } from "@/db/schema";

export function seedReports(tx: any): void {
  tx.insert(reports).values([
    {
      id: "r1", websiteId: "1", name: "Informe Mensual — Junio 2026", status: "scheduled",
      frequency: "monthly", period: "Junio 2026",
      scheduleDescription: "día 1 de cada mes", scheduleEnabled: 1,
      metrics: JSON.stringify({ "Posición Media": "8.4 ↑", "Tráfico Estimado": "24.8K", "Backlinks": "1,204" }),
      colorScheme: "indigo",
      shareUrl: "https://multiseo.app/report/demo/june-2026?token=eyJhbG...",
      shareExpiresIn: 13, createdAt: new Date().toISOString(),
    },
    {
      id: "r2", websiteId: "2", name: "Informe Semanal — Semana 23", status: "sent",
      frequency: "weekly", period: "2-8 Jun 2026",
      scheduleDescription: "cada lunes 08:00", scheduleEnabled: 1,
      metrics: JSON.stringify({ "Keywords Top 10": "8/16", "Artículos Publicados": "2", "Mejora Semanal": "+2.3%" }),
      colorScheme: "green",
      shareUrl: "https://multiseo.app/report/demo/week-23?token=abc...",
      shareExpiresIn: 4, createdAt: new Date().toISOString(),
    },
    {
      id: "r3", websiteId: "1", name: "Nuevo Reporte Personalizado", status: "draft",
      frequency: "custom", period: "",
      scheduleEnabled: 0,
      metrics: JSON.stringify({}),
      colorScheme: "indigo", createdAt: new Date().toISOString(),
    },
  ]).run();
}
