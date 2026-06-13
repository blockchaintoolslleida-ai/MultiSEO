import { exec } from "child_process";

function execLighthouse(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      command,
      {
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024, // 10MB
        shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
      },
      (error: Error | null, stdout: string) => {
        // Lighthouse may exit non-zero due to temp cleanup EPERM,
        // but stdout may still contain valid JSON from the audit.
        if (stdout) {
          resolve(stdout);
        } else {
          reject(error || new Error("No output from Lighthouse"));
        }
      }
    );
  });
}

export interface LighthouseScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
}

export interface LighthouseAuditResult {
  scores: LighthouseScores;
  url: string;
  timestamp: string;
  summary: string[];
  recommendations: { title: string; description: string }[];
}

export async function runLighthouseAudit(url: string): Promise<LighthouseAuditResult> {
  const targetUrl = url.startsWith("http") ? url : `https://${url}`;

  const args = [
    targetUrl,
    "--output=json",
    "--only-categories=performance,accessibility,best-practices,seo",
    '--chrome-flags="--headless --no-sandbox --disable-gpu"',
    "--quiet",
  ];

  try {
    const stdout = await execLighthouse(`npx lighthouse ${args.join(" ")}`);

    // Extract JSON from stdout (may contain warnings before/after the JSON)
    const jsonMatch = stdout.match(/\{[\s\S]*"categories"[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`No valid Lighthouse JSON found in output. Output: ${stdout.slice(0, 500)}`);
    }

    const lhr = JSON.parse(jsonMatch[0]);

    const categories = lhr.categories ?? {};
    const audits = lhr.audits ?? {};

    const scores: LighthouseScores = {
      performance: Math.round((categories.performance?.score ?? 0) * 100),
      accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((categories["best-practices"]?.score ?? 0) * 100),
      seo: Math.round((categories.seo?.score ?? 0) * 100),
      pwa: 0,
    };

    const avgScore = Math.round(
      (scores.performance + scores.accessibility + scores.bestPractices + scores.seo) / 4
    );

    const summary: string[] = [
      `Health: ${avgScore}%`,
      scores.performance >= 90
        ? "✅ Performance excellent"
        : scores.performance >= 50
          ? "⚠️ Performance needs work"
          : "🔴 Performance critical",
      scores.seo >= 90
        ? "✅ SEO strong"
        : scores.seo >= 50
          ? "⚠️ SEO could improve"
          : "🔴 SEO needs attention",
    ];

    const auditKeys = [
      { id: "render-blocking-resources", title: "Eliminar recursos bloqueantes" },
      { id: "unused-css-rules", title: "Eliminar CSS no usado" },
      { id: "unused-javascript", title: "Eliminar JavaScript no usado" },
      { id: "uses-optimized-images", title: "Optimizar imágenes" },
      { id: "uses-text-compression", title: "Activar compresión de texto" },
      { id: "meta-description", title: "Añadir meta descriptions" },
      { id: "image-alt", title: "Añadir atributos alt a imágenes" },
      { id: "dom-size", title: "Reducir tamaño del DOM" },
    ];

    const recommendations: { title: string; description: string }[] = [];
    for (const { id, title } of auditKeys) {
      const audit = audits[id];
      if (audit && audit.score !== null && audit.score < 0.9) {
        const desc =
          audit.description
            ?.replace(/\[Learn more.*?\]/g, "")
            .trim()
            .slice(0, 160) || title;
        recommendations.push({ title, description: desc });
      }
      if (recommendations.length >= 5) break;
    }

    return {
      scores,
      url: targetUrl,
      timestamp: new Date().toISOString(),
      summary,
      recommendations,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Lighthouse audit failed: ${msg}`);
  }
}
