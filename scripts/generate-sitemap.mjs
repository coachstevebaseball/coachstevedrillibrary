/**
 * Build-time sitemap generator for coachsteve.manus.space
 *
 * Reads all visible drill IDs from the database and writes
 * client/public/sitemap.xml so it gets copied into dist/public/ by Vite.
 *
 * Usage: node scripts/generate-sitemap.mjs
 * (called automatically as part of `pnpm build` via package.json)
 */

import { createConnection } from "mysql2/promise";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(ROOT, ".env") });

const BASE_URL = "https://coachsteve.manus.space";
const TODAY = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

async function getDrillIds() {
  const conn = await createConnection(process.env.DATABASE_URL);
  try {
    const [rows] = await conn.execute(
      "SELECT drillId FROM drills WHERE isHidden = 0 OR isHidden IS NULL ORDER BY name"
    );
    return rows.map((r) => r.drillId);
  } finally {
    await conn.end();
  }
}

function buildSitemap(drillIds) {
  // Static routes that are publicly indexable
  const staticRoutes = [
    { loc: "/", priority: "1.0", changefreq: "weekly" },
    { loc: "/embed", priority: "0.8", changefreq: "weekly" },
    { loc: "/embed/drills", priority: "0.9", changefreq: "daily" },
  ];

  // Embed drill detail pages — these are the publicly crawlable drill pages
  const drillRoutes = drillIds.map((id) => ({
    loc: `/embed/drill/${id}`,
    priority: "0.7",
    changefreq: "monthly",
  }));

  const allRoutes = [...staticRoutes, ...drillRoutes];

  const urlEntries = allRoutes
    .map(
      ({ loc, priority, changefreq }) =>
        `  <url>\n    <loc>${BASE_URL}${loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>
`;
}

async function main() {
  console.log("[sitemap] Fetching drill IDs from database...");
  let drillIds = [];
  try {
    drillIds = await getDrillIds();
    console.log(`[sitemap] Found ${drillIds.length} visible drills`);
  } catch (err) {
    console.warn("[sitemap] Could not connect to DB, using empty drill list:", err.message);
    // Fallback: generate sitemap with just static routes
  }

  const xml = buildSitemap(drillIds);
  const outPath = path.join(ROOT, "client", "public", "sitemap.xml");
  await fs.writeFile(outPath, xml, "utf-8");
  console.log(`[sitemap] Written to ${outPath} (${drillIds.length + 3} URLs)`);
}

main().catch((err) => {
  console.error("[sitemap] Fatal error:", err);
  process.exit(1);
});
