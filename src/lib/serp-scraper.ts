import { chromium, type Browser } from "playwright";

interface ScrapedResult {
  position: number;
  title: string;
  url: string;
  snippet: string;
}

interface SerpScrapeOutput {
  keyword: string;
  position: number;
  url: string;
  totalResults: number;
  topCompetitors: { domain: string; position: number; title: string }[];
  rawResults: ScrapedResult[];
}

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });
  }
  return browser;
}

// Random delay to avoid detection
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Stealth helpers
const STEALTH_SCRIPTS = [
  // Overwrite navigator.webdriver
  'Object.defineProperty(navigator, "webdriver", { get: () => false });',
  // Overwrite chrome object
  'window.chrome = { runtime: {} };',
  // Overwrite plugins
  'Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });',
  // Overwrite languages
  'Object.defineProperty(navigator, "languages", { get: () => ["es-ES", "es", "en-US", "en"] });',
];

export async function scrapeKeyword(
  keyword: string,
  targetDomain?: string
): Promise<SerpScrapeOutput> {
  const b = await getBrowser();
  const context = await b.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "es-ES",
  });

  const page = await context.newPage();

  try {
    // Apply stealth scripts
    for (const script of STEALTH_SCRIPTS) {
      await page.addInitScript(script);
    }

    // Search Google
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=es&gl=ES&num=20`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Random delay to simulate human
    await delay(2000 + Math.random() * 3000);

    // Accept cookies if present
    try {
      const acceptBtn = await page.$("button:has-text('Aceptar todo'), button:has-text('Accept all'), button:has-text('Aceptar')");
      if (acceptBtn) {
        await acceptBtn.click();
        await delay(1000);
      }
    } catch {
      // Cookie dialog might not exist
    }

    // Check page loaded correctly
    const pageText = await page.textContent("body");
    if (pageText && pageText.includes("our systems have detected unusual traffic")) {
      throw new Error("Google blocked the request — try again later or use a proxy");
    }

    // Extract organic results — Google's current SERP structure
    const results = await page.evaluate(() => {
      const items: ScrapedResult[] = [];

      // Modern Google SERP: find all <a> with h3 inside (the main result links)
      const allLinks = document.querySelectorAll("a");
      const seen = new Set<string>();

      for (const link of allLinks) {
        const href = link.getAttribute("href") || "";
        // Only real external results
        if (!href.startsWith("http") || href.includes("google.com")) continue;

        const h3 = link.querySelector("h3");
        if (!h3) continue;

        const title = h3.textContent?.trim() || "";
        if (!title || seen.has(title)) continue;
        seen.add(title);

        // Find snippet: look for text in parent/ancestor divs
        let snippet = "";
        let parent = link.parentElement;
        for (let i = 0; i < 5 && parent; i++) {
          const textDivs = parent.querySelectorAll("div");
          for (const div of textDivs) {
            const text = div.textContent?.trim() || "";
            if (text.length > 30 && text.length < 300 && !text.includes(title)) {
              snippet = text;
              break;
            }
          }
          if (snippet) break;
          parent = parent.parentElement;
        }

        items.push({
          position: items.length + 1,
          title,
          url: href,
          snippet: snippet || "",
        });

        if (items.length >= 10) break;
      }

      return items;
    });

    // Find target domain position
    let position = 0;
    let targetUrl = "";
    if (targetDomain) {
      const found = results.find((r) => r.url.includes(targetDomain.replace("www.", "")));
      if (found) {
        position = found.position;
        targetUrl = found.url;
      }
    }

    // Extract top competitors (domains different from target)
    const topCompetitors = results
      .filter((r) => !targetDomain || !r.url.includes(targetDomain.replace("www.", "")))
      .slice(0, 5)
      .map((r) => ({
        domain: new URL(r.url).hostname.replace("www.", ""),
        position: r.position,
        title: r.title,
      }));

    return {
      keyword,
      position: position || results.length + 1,
      url: targetUrl || results[0]?.url || "",
      totalResults: results.length,
      topCompetitors,
      rawResults: results,
    };
  } finally {
    await context.close();
  }
}

export async function scrapeWebsiteKeywords(
  domain: string,
  keywords: string[]
): Promise<SerpScrapeOutput[]> {
  const results: SerpScrapeOutput[] = [];

  for (const kw of keywords) {
    try {
      const result = await scrapeKeyword(kw, domain);
      results.push(result);
      // Rate limiting between searches
      await delay(5000 + Math.random() * 5000);
    } catch (error) {
      console.error(`Failed to scrape "${kw}":`, error);
      // Continue with next keyword even if one fails
    }
  }

  return results;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
