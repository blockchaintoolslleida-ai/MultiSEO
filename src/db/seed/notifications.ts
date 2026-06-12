import { notifications } from "@/db/schema";

export function seedNotifications(tx: any): void {
  tx.insert(notifications).values([
    { id: "n1", tenantId: "demo", message: "competidor2.es subió 3 posiciones", type: "warning", time: "Hace 10m", read: 0, createdAt: new Date().toISOString() },
    { id: "n2", tenantId: "demo", message: "Artículo 'SEO B2B' generado con éxito", type: "success", time: "Hace 1h", read: 0, createdAt: new Date().toISOString() },
    { id: "n3", tenantId: "demo", message: "Conexión FTP fallida en old-project.net", type: "error", time: "Hace 3h", read: 0, createdAt: new Date().toISOString() },
    { id: "n4", tenantId: "demo", message: "Informe semanal listo para enviar", type: "info", time: "Hace 5h", read: 1, createdAt: new Date().toISOString() },
  ]).run();
}
