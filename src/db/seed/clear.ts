import { geoResults, geoQueries, notifications, reports, articles, rankingHistory, keywords, competitors, websites, tenants } from "@/db/schema";

export function seedClear(tx: any): void {
  tx.delete(geoResults).run();
  tx.delete(geoQueries).run();
  tx.delete(notifications).run();
  tx.delete(reports).run();
  tx.delete(articles).run();
  tx.delete(rankingHistory).run();
  tx.delete(keywords).run();
  tx.delete(competitors).run();
  tx.delete(websites).run();
  tx.delete(tenants).run();
}
