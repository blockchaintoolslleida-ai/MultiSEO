const TRANSFORMERS: ((kw: string) => string)[] = [
  (kw: string) => `¿cuál es el mejor ${kw}?`,
  (kw: string) => `recomiéndame ${kw}`,
  (kw: string) => `¿qué ${kw} me recomiendas?`,
  (kw: string) => `mejores ${kw}`,
];

export function transformKeywordToQueries(keyword: string): string[] {
  return TRANSFORMERS.map((fn) => fn(keyword));
}

export function transformAllKeywords(
  keywords: { keyword: string }[]
): { keyword: string; query: string }[] {
  const result: { keyword: string; query: string }[] = [];
  for (const kw of keywords) {
    for (const query of transformKeywordToQueries(kw.keyword)) {
      result.push({ keyword: kw.keyword, query });
    }
  }
  return result;
}
