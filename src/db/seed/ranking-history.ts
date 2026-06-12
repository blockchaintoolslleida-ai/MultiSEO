import { rankingHistory } from "@/db/schema";

const websiteHistory: Record<string, [string, number][]> = {
  "1": [
    ["10 May",14.2],["12 May",13.8],["14 May",14.5],["16 May",13.1],["18 May",12.9],["20 May",12.4],["22 May",11.8],["24 May",11.2],["26 May",10.7],["28 May",10.3],["30 May",9.8],["1 Jun",9.5],["3 Jun",9.2],["5 Jun",8.9],["7 Jun",8.6],["8 Jun",8.4],
  ],
  "2": [
    ["10 May",16.5],["12 May",16.1],["14 May",15.8],["16 May",15.2],["18 May",14.9],["20 May",14.5],["22 May",14.1],["24 May",13.8],["26 May",13.4],["28 May",13.0],["30 May",12.7],["1 Jun",12.5],["3 Jun",12.3],["5 Jun",12.2],["7 Jun",12.1],["8 Jun",12.1],
  ],
  "3": [
    ["10 May",25.0],["12 May",24.5],["14 May",24.0],["16 May",23.8],["18 May",23.2],["20 May",23.0],["22 May",22.8],["24 May",22.5],["26 May",22.3],["28 May",22.2],["30 May",22.1],["1 Jun",22.0],["3 Jun",22.0],["5 Jun",22.0],["7 Jun",22.0],["8 Jun",22.0],
  ],
  "5": [
    ["10 May",8.2],["12 May",7.9],["14 May",7.7],["16 May",7.4],["18 May",7.2],["20 May",6.9],["22 May",6.7],["24 May",6.5],["26 May",6.3],["28 May",6.1],["30 May",5.9],["1 Jun",5.8],["3 Jun",5.7],["5 Jun",5.6],["7 Jun",5.6],["8 Jun",5.6],
  ],
  "e74b0ab2-f1a3-4c8d-9e6b-2d5f7a8c9e01": [
    ["10 May",10.2],["12 May",9.9],["14 May",9.6],["16 May",9.3],["18 May",9.0],["20 May",8.7],["22 May",8.4],["24 May",8.1],["26 May",7.8],["28 May",7.5],["30 May",7.2],["1 Jun",6.9],["3 Jun",6.6],["5 Jun",6.4],["7 Jun",6.2],["8 Jun",6.2],
  ],
  "1e311052-a2b4-4d9e-7f6c-3e5a8b9d0f12": [
    ["10 May",9.5],["12 May",9.2],["14 May",9.0],["16 May",8.8],["18 May",8.5],["20 May",8.3],["22 May",8.1],["24 May",7.9],["26 May",7.7],["28 May",7.5],["30 May",7.3],["1 Jun",7.1],["3 Jun",6.9],["5 Jun",6.8],["7 Jun",6.8],["8 Jun",6.8],
  ],
  "dd262b94-b3c5-4e0a-8f7d-4f6b9c0e1a23": [
    ["10 May",11.0],["12 May",10.8],["14 May",10.5],["16 May",10.3],["18 May",10.0],["20 May",9.8],["22 May",9.6],["24 May",9.4],["26 May",9.2],["28 May",9.0],["30 May",8.9],["1 Jun",8.8],["3 Jun",8.8],["5 Jun",8.8],["7 Jun",8.8],["8 Jun",8.8],
  ],
};

export function seedRankingHistory(tx: any): void {
  for (const [wid, points] of Object.entries(websiteHistory)) {
    for (const [date, avgPosition] of points) {
      tx.insert(rankingHistory).values({ websiteId: wid, date, avgPosition }).run();
    }
  }
}
