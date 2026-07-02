/**
 * SEO Prerender Middleware
 *
 * Detects crawler / AI bot User-Agents and responds with fully-formed HTML
 * containing real drill content instead of the empty React SPA shell.
 *
 * Routes handled:
 *   GET /embed/drills        → drill library listing (all visible drills)
 *   GET /embed/drill/:id     → individual drill detail page
 *   GET /embed               → embed landing page
 *   GET /                    → site landing page (static meta only)
 *
 * For regular browser requests the middleware calls next() and the SPA
 * takes over as normal.
 */

import type { Request, Response, NextFunction } from "express";
import { getAllDrills, getDrillBySlug } from "./db";

// ── Crawler detection ──────────────────────────────────────────────────────

const CRAWLER_UA_PATTERNS = [
  // Search engines
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /sogou/i,
  /exabot/i,
  /facebot/i,
  /ia_archiver/i,
  // AI / LLM crawlers
  /gptbot/i,
  /chatgpt-user/i,
  /perplexitybot/i,
  /claude-web/i,
  /anthropic-ai/i,
  /cohere-ai/i,
  /youbot/i,
  /applebot/i,
  /semrushbot/i,
  /ahrefsbot/i,
  // Generic
  /spider/i,
  /crawler/i,
  /scraper/i,
  /bot\b/i,
  // Fetch-based tools that don't run JS
  /curl\//i,
  /wget\//i,
  /python-requests/i,
  /httpx/i,
  /go-http-client/i,
  /java\//i,
];

function isCrawler(userAgent: string): boolean {
  if (!userAgent) return false;
  return CRAWLER_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}

// ── HTML helpers ──────────────────────────────────────────────────────────

const SITE_NAME = "Coach Steve | Baseball Drill Library";
const BASE_URL = "https://coachsteve.manus.space";
const THEME_COLOR = "#e4002b";

function htmlEscape(str: string): string {
  return (str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHead({
  title,
  description,
  canonicalPath,
  ogType = "website",
}: {
  title: string;
  description: string;
  canonicalPath: string;
  ogType?: string;
}): string {
  const canonical = `${BASE_URL}${canonicalPath}`;
  return `
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${htmlEscape(title)}</title>
  <meta name="description" content="${htmlEscape(description)}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${htmlEscape(canonical)}" />
  <!-- Open Graph -->
  <meta property="og:title" content="${htmlEscape(title)}" />
  <meta property="og:description" content="${htmlEscape(description)}" />
  <meta property="og:type" content="${ogType}" />
  <meta property="og:url" content="${htmlEscape(canonical)}" />
  <meta property="og:site_name" content="${htmlEscape(SITE_NAME)}" />
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${htmlEscape(title)}" />
  <meta name="twitter:description" content="${htmlEscape(description)}" />
  <meta name="theme-color" content="${THEME_COLOR}" />
  <style>
    body { font-family: system-ui, sans-serif; background: #07111F; color: #f1f5f9; margin: 0; padding: 0; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem 1rem; }
    h1 { color: #f1f5f9; font-size: 2rem; margin-bottom: 0.5rem; }
    h2 { color: #e4002b; font-size: 1.1rem; margin: 0 0 0.25rem; }
    p { color: #94a3b8; margin: 0 0 1rem; line-height: 1.6; }
    .drill-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-top: 1.5rem; }
    .drill-card { background: #0a1628; border: 1px solid rgba(255,255,255,0.08); border-radius: 0.75rem; padding: 1.25rem; }
    .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-right: 0.25rem; margin-bottom: 0.5rem; }
    .badge-easy { background: #052e16; color: #4ade80; }
    .badge-medium { background: #451a03; color: #fbbf24; }
    .badge-hard { background: #450a0a; color: #f87171; }
    .badge-cat { background: #1e293b; color: #94a3b8; }
    .section-label { color: #e4002b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
    .detail-section { margin-bottom: 1.5rem; }
    ul { color: #94a3b8; padding-left: 1.25rem; margin: 0.5rem 0; }
    li { margin-bottom: 0.25rem; line-height: 1.5; }
    a { color: #e4002b; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .back-link { display: inline-block; margin-bottom: 1.5rem; color: #94a3b8; font-size: 0.875rem; }
    .header { background: #0a1628; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 1rem; }
    .header-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; gap: 0.75rem; }
    .logo { background: #e4002b; color: white; font-weight: 800; font-size: 0.875rem; padding: 0.375rem 0.625rem; border-radius: 0.375rem; }
    .site-title { color: #f1f5f9; font-weight: 600; }
  </style>`;
}

function buildHeader(): string {
  return `
  <header class="header">
    <div class="header-inner">
      <span class="logo">CS</span>
      <span class="site-title">Coach Steve | Baseball Drill Library</span>
    </div>
  </header>`;
}

// ── Route handlers ────────────────────────────────────────────────────────

async function renderDrillLibrary(res: Response, path: string) {
  const drills = await getAllDrills();

  const title = `Baseball Drill Library — ${drills.length} Professional Training Drills | Coach Steve`;
  const description = `Browse ${drills.length} professional baseball drills for hitting, pitching, infield, outfield, and bunting. Developed by Coach Steve for serious player development.`;

  const drillCards = drills
    .map((d: ReturnType<typeof getAllDrills> extends Promise<Array<infer T>> ? T : never) => {
      const cats = ((d.categories as string[]) ?? [])
        .map((c) => `<span class="badge badge-cat">${htmlEscape(c)}</span>`)
        .join("");
      const diffClass =
        d.difficulty === "Easy"
          ? "badge-easy"
          : d.difficulty === "Hard"
          ? "badge-hard"
          : "badge-medium";
      const drillUrl = `${BASE_URL}/embed/drill/${htmlEscape(d.drillId)}`;
      return `
      <div class="drill-card" itemscope itemtype="https://schema.org/HowTo">
        <h2 itemprop="name"><a href="${drillUrl}">${htmlEscape(d.name)}</a></h2>
        <div>
          <span class="badge ${diffClass}">${htmlEscape(d.difficulty ?? "")}</span>
          ${cats}
        </div>
        ${d.duration ? `<p style="font-size:0.8rem;color:#64748b;margin-top:0.25rem;">⏱ ${htmlEscape(d.duration)}</p>` : ""}
      </div>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>${buildHead({ title, description, canonicalPath: path })}</head>
<body>
${buildHeader()}
<main class="container">
  <h1>Baseball Drill Library</h1>
  <p>${drills.length} professional training drills developed by Coach Steve for serious player development. Filter by category, difficulty, and duration to find the right drill for your practice plan.</p>
  <div class="drill-grid" itemscope itemtype="https://schema.org/ItemList">
    ${drillCards}
  </div>
</main>
</body>
</html>`;

  res.status(200).set("Content-Type", "text/html; charset=utf-8").end(html);
}

async function renderDrillDetail(res: Response, drillId: string) {
  // Fetch the drill from the DB
  const drill = await getDrillBySlug(drillId);
  if (!drill) {
    res.status(404).set("Content-Type", "text/html; charset=utf-8").end(`<!DOCTYPE html>
<html lang="en"><head><title>Drill Not Found</title><meta name="robots" content="noindex" /></head>
<body><h1>Drill not found</h1></body></html>`);
    return;
  }

  const cats = ((drill.categories as string[]) ?? []).join(", ");
  const title = `${drill.name} — Baseball Drill | Coach Steve`;
  const descParts: string[] = [];
  if (cats) descParts.push(`Category: ${cats}.`);
  if (drill.difficulty) descParts.push(`Difficulty: ${drill.difficulty}.`);
  if (drill.goalOfDrill) descParts.push(drill.goalOfDrill);
  const description = descParts.join(" ").slice(0, 200) || `${drill.name} — a professional baseball training drill by Coach Steve.`;

  const canonicalPath = `/embed/drill/${drillId}`;

  // Build sections
  const sections: string[] = [];

  if (drill.goalOfDrill) {
    sections.push(`
    <div class="detail-section">
      <div class="section-label">Goal</div>
      <p>${htmlEscape(drill.goalOfDrill)}</p>
    </div>`);
  }

  if (drill.whoThisDrillIsBestFor) {
    sections.push(`
    <div class="detail-section">
      <div class="section-label">Best For</div>
      <p>${htmlEscape(drill.whoThisDrillIsBestFor)}</p>
    </div>`);
  }

  const howToRun = (drill.howToRunTheDrill as string[] | null) ?? [];
  if (howToRun.length > 0) {
    sections.push(`
    <div class="detail-section">
      <div class="section-label">How To Do It</div>
      <ul>${howToRun.map((s) => `<li>${htmlEscape(s)}</li>`).join("")}</ul>
    </div>`);
  }

  const coachingNotes = (drill.coachingNotes as string[] | null) ?? [];
  if (coachingNotes.length > 0) {
    sections.push(`
    <div class="detail-section">
      <div class="section-label">What To Feel</div>
      <ul>${coachingNotes.map((s) => `<li>${htmlEscape(s)}</li>`).join("")}</ul>
    </div>`);
  }

  if (drill.coachSteveCue) {
    sections.push(`
    <div class="detail-section">
      <div class="section-label">Coach Steve's Cue</div>
      <p><em>"${htmlEscape(drill.coachSteveCue)}"</em></p>
    </div>`);
  }

  const mistakes = (drill.commonMistakes as string[] | null) ?? [];
  if (mistakes.length > 0) {
    sections.push(`
    <div class="detail-section">
      <div class="section-label">Common Mistakes</div>
      <ul>${mistakes.map((s) => `<li>${htmlEscape(s)}</li>`).join("")}</ul>
    </div>`);
  }

  if (drill.gameTransferExplanation) {
    sections.push(`
    <div class="detail-section">
      <div class="section-label">Watch For</div>
      <p>${htmlEscape(drill.gameTransferExplanation)}</p>
    </div>`);
  }

  const whatFixes = (drill.whatThisDrillHelpsFix as string[] | null) ?? [];
  if (whatFixes.length > 0) {
    sections.push(`
    <div class="detail-section">
      <div class="section-label">Problem It Solves</div>
      <ul>${whatFixes.map((s) => `<li>${htmlEscape(s)}</li>`).join("")}</ul>
    </div>`);
  }

  const equipment = (drill.equipment as string[] | null) ?? [];
  if (equipment.length > 0) {
    sections.push(`
    <div class="detail-section">
      <div class="section-label">Equipment</div>
      <ul>${equipment.map((s) => `<li>${htmlEscape(s)}</li>`).join("")}</ul>
    </div>`);
  }

  const diffClass =
    drill.difficulty === "Easy"
      ? "badge-easy"
      : drill.difficulty === "Hard"
      ? "badge-hard"
      : "badge-medium";
  const catBadges = ((drill.categories as string[]) ?? [])
    .map((c) => `<span class="badge badge-cat">${htmlEscape(c)}</span>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>${buildHead({ title, description, canonicalPath, ogType: "article" })}</head>
<body>
${buildHeader()}
<main class="container" itemscope itemtype="https://schema.org/HowTo" itemprop="name" content="${htmlEscape(drill.name)}">
  <a href="${BASE_URL}/embed/drills" class="back-link">← Back to Drill Library</a>
  <h1>${htmlEscape(drill.name)}</h1>
  <div style="margin-bottom:1rem;">
    <span class="badge ${diffClass}">${htmlEscape(drill.difficulty ?? "")}</span>
    ${catBadges}
    ${drill.duration ? `<span class="badge badge-cat">⏱ ${htmlEscape(drill.duration)}</span>` : ""}
  </div>
  ${sections.join("\n")}
  ${sections.length === 0 ? `<p>Detailed coaching content for this drill is available in the Coach Steve app.</p>` : ""}
</main>
</body>
</html>`;

  res.status(200).set("Content-Type", "text/html; charset=utf-8").end(html);
}

async function renderEmbedHome(res: Response) {
  const title = `Coach Steve Baseball Drill Library — Player Development Platform`;
  const description = `Professional baseball training drills designed to build elite mechanics, explosive power, and game-ready confidence. Browse the full drill library by Coach Steve.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>${buildHead({ title, description, canonicalPath: "/embed" })}</head>
<body>
${buildHeader()}
<main class="container">
  <h1>Player Development Platform</h1>
  <p>Professional training drills designed to build elite mechanics, explosive power, and game-ready confidence.</p>
  <p><a href="${BASE_URL}/embed/drills">Browse the full drill library →</a></p>
</main>
</body>
</html>`;

  res.status(200).set("Content-Type", "text/html; charset=utf-8").end(html);
}

async function renderSiteLanding(res: Response) {
  const title = `Coach Steve | Baseball Drill Library — 100+ Professional Training Drills`;
  const description = `Access 100+ professional baseball drills for hitting, pitching, infield, outfield, and bunting. Developed by Coach Steve for serious player development.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>${buildHead({ title, description, canonicalPath: "/" })}</head>
<body>
${buildHeader()}
<main class="container">
  <h1>Coach Steve Baseball Drill Library</h1>
  <p>Access 100+ professional baseball drills for hitting, pitching, infield, outfield, and bunting. Developed by Coach Steve for serious player development.</p>
  <p><a href="${BASE_URL}/embed/drills">Browse the Drill Library →</a></p>
</main>
</body>
</html>`;

  res.status(200).set("Content-Type", "text/html; charset=utf-8").end(html);
}

// ── Middleware export ──────────────────────────────────────────────────────

export function seoPrerender(req: Request, res: Response, next: NextFunction) {
  const ua = req.headers["user-agent"] || "";

  // Always serve robots.txt and sitemap.xml as static files — skip prerender
  if (req.path === "/robots.txt" || req.path === "/sitemap.xml") {
    return next();
  }

  // Only intercept GET requests from crawlers
  if (req.method !== "GET" || !isCrawler(ua)) {
    return next();
  }

  const path = req.path;

  // Route matching
  if (path === "/" || path === "") {
    renderSiteLanding(res).catch(next);
    return;
  }

  if (path === "/embed" || path === "/embed/") {
    renderEmbedHome(res).catch(next);
    return;
  }

  if (path === "/embed/drills" || path === "/embed/drills/") {
    renderDrillLibrary(res, path).catch(next);
    return;
  }

  const drillMatch = path.match(/^\/embed\/drill\/([^/]+)\/?$/);
  if (drillMatch) {
    renderDrillDetail(res, drillMatch[1]).catch(next);
    return;
  }

  // No prerender match — pass to SPA
  next();
}
