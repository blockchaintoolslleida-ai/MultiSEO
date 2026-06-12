import { db } from "@/db";
import { seedClear } from "./clear";
import { seedTenants } from "./tenants";
import { seedWebsites } from "./websites";
import { seedKeywords } from "./keywords";
import { seedCompetitors } from "./competitors";
import { seedRankingHistory } from "./ranking-history";
import { seedGeo } from "./geo";
import { seedArticles } from "./articles";
import { seedReports } from "./reports";
import { seedNotifications } from "./notifications";

export function seed(): void {
  db.transaction((tx) => {
    seedClear(tx);
    seedTenants(tx);
    seedWebsites(tx);
    seedKeywords(tx);
    seedCompetitors(tx);
    seedRankingHistory(tx);
    seedGeo(tx);
    seedArticles(tx);
    seedReports(tx);
    seedNotifications(tx);
  });

  console.log("Seed completed: 2 tenants, 5 websites, 5 keywords, 5 competitors, 16 ranking points, 6 articles, 3 reports, 4 notifications");
}
