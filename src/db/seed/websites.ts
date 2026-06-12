import { websites } from "@/db/schema";

export function seedWebsites(tx: any): void {
  tx.insert(websites).values([
    {
      id: "1", tenantId: "demo", domain: "sitioweb.com", status: "connected",
      accessTypes: JSON.stringify(["wordpress", "ftp", "cpanel"]),
      keywordsCount: 24, articlesCount: 18, avgPosition: 8.4,
      estimatedTraffic: 24800, backlinksCount: 1204, healthScore: 72,
      lastAudit: "Hace 2h", createdAt: new Date().toISOString(),
    },
    {
      id: "2", tenantId: "demo", domain: "mitiendaonline.es", status: "connected",
      accessTypes: JSON.stringify(["wordpress", "ssh"]),
      keywordsCount: 16, articlesCount: 9, avgPosition: 12.1,
      estimatedTraffic: 12000, backlinksCount: 580, healthScore: 65,
      lastAudit: "Hace 5h", createdAt: new Date().toISOString(),
    },
    {
      id: "3", tenantId: "demo", domain: "blog-antiguo.com", status: "no-access",
      accessTypes: JSON.stringify(["wordpress"]),
      keywordsCount: 8, articlesCount: 0, avgPosition: 22,
      estimatedTraffic: 2100, backlinksCount: 94, healthScore: 40,
      lastAudit: "Hace 12d", errorMessage: "Credenciales expiradas — actualizar acceso",
      createdAt: new Date().toISOString(),
    },
    {
      id: "4", tenantId: "demo", domain: "old-project.net", status: "error",
      accessTypes: JSON.stringify(["ftp", "cpanel"]),
      keywordsCount: 5, articlesCount: 0, avgPosition: 35,
      estimatedTraffic: 800, backlinksCount: 32, healthScore: 22,
      lastAudit: "Nunca", errorMessage: "Error conexión FTP — timeout tras 30s",
      createdAt: new Date().toISOString(),
    },
    {
      id: "5", tenantId: "demo", domain: "agencia-marketing.io", status: "connected",
      accessTypes: JSON.stringify(["wordpress", "ftp", "ssh"]),
      keywordsCount: 32, articlesCount: 27, avgPosition: 5.6,
      estimatedTraffic: 42000, backlinksCount: 2100, healthScore: 88,
      lastAudit: "Hace 30m", createdAt: new Date().toISOString(),
    },
    {
      id: "e74b0ab2-f1a3-4c8d-9e6b-2d5f7a8c9e01", tenantId: "demo", domain: "www.silviaclua.com", status: "connected",
      accessTypes: JSON.stringify(["wordpress"]),
      keywordsCount: 5, articlesCount: 0, avgPosition: 6.2,
      estimatedTraffic: 5000, backlinksCount: 200, healthScore: 85,
      lastAudit: "Hace 1h", createdAt: new Date().toISOString(),
    },
    {
      id: "1e311052-a2b4-4d9e-7f6c-3e5a8b9d0f12", tenantId: "demo", domain: "www.traumare.com", status: "connected",
      accessTypes: JSON.stringify(["wordpress"]),
      keywordsCount: 5, articlesCount: 0, avgPosition: 6.8,
      estimatedTraffic: 5000, backlinksCount: 200, healthScore: 74,
      lastAudit: "Hace 1h", createdAt: new Date().toISOString(),
    },
    {
      id: "dd262b94-b3c5-4e0a-8f7d-4f6b9c0e1a23", tenantId: "demo", domain: "participa.blockchaintools.cat", status: "connected",
      accessTypes: JSON.stringify(["wordpress"]),
      keywordsCount: 4, articlesCount: 0, avgPosition: 8.8,
      estimatedTraffic: 5000, backlinksCount: 200, healthScore: 76,
      lastAudit: "Hace 1h", createdAt: new Date().toISOString(),
    },
  ]).run();
}
