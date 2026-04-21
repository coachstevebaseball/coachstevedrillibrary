/**
 * ogImage.ts
 * ----------
 * Generates dynamic Open Graph images for drill detail pages.
 * Endpoint: GET /api/og/drill/:id
 *
 * Returns a 1200×630 PNG with:
 *   - Dark background with red accent
 *   - Drill name (large)
 *   - Difficulty badge + category
 *   - "Coach Steve's Hitters Lab" branding
 *
 * Used by both /drill/:id and /embed/drill/:id via <meta og:image> tags.
 */

import { Router } from "express";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { getDrillDetail, getCustomDrills } from "./db";
// Cache generated images in memory (keyed by drillId) for 1 hour
const imageCache = new Map<string, { png: Buffer; ts: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Static drill data (imported at module level for fast lookup)
// We import the compiled JS from the client bundle path or read the TS source
// Instead, we keep a lightweight inline lookup from the drillDetails DB table
async function getDrillMeta(drillId: string): Promise<{
  name: string;
  difficulty: string;
  category: string;
  problems: string[];
} | null> {
  // 1. Try drillDetails table
  const detail = await getDrillDetail(drillId);
  if (detail) {
    const d = detail as any;
    return {
      name: d.name || drillId,
      difficulty: d.difficulty || "Medium",
      category: d.skillSet || d.category || "Hitting",
      problems: [],
    };
  }

  // 2. Try customDrills table
  const allCustom = await getCustomDrills();
  const custom = allCustom.find((c: any) => c.drillId === drillId);
  if (custom) {
    const c = custom as any;
    return {
      name: c.name || drillId,
      difficulty: c.difficulty || "Medium",
      category: c.category || "Hitting",
      problems: [],
    };
  }

  return null;
}

function difficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "Easy":
      return "#22c55e";
    case "Medium":
      return "#f59e0b";
    case "Hard":
      return "#ef4444";
    default:
      return "#94a3b8";
  }
}

async function generateOgImage(
  name: string,
  difficulty: string,
  category: string
): Promise<Buffer> {
  const diffColor = difficultyColor(difficulty);

  // Build the JSX-like element tree for satori
  const element = {
    type: "div",
    props: {
      style: {
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column" as const,
        backgroundColor: "#0a0a0f",
        fontFamily: "sans-serif",
        position: "relative" as const,
        overflow: "hidden",
      },
      children: [
        // Red accent bar at top
        {
          type: "div",
          props: {
            style: {
              position: "absolute" as const,
              top: 0,
              left: 0,
              right: 0,
              height: 6,
              background: "linear-gradient(90deg, #dc2626, #991b1b)",
            },
          },
        },
        // Background glow
        {
          type: "div",
          props: {
            style: {
              position: "absolute" as const,
              top: -100,
              right: -100,
              width: 500,
              height: 500,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(220,38,38,0.12) 0%, transparent 70%)",
            },
          },
        },
        // Main content
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column" as const,
              justifyContent: "space-between",
              padding: "60px 80px",
              height: "100%",
            },
            children: [
              // Top: branding
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          backgroundColor: "#dc2626",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                          fontWeight: 900,
                          color: "white",
                        },
                        children: "CS",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: 18,
                          color: "#64748b",
                          fontWeight: 500,
                          letterSpacing: 1,
                        },
                        children: "Coach Steve's Hitters Lab",
                      },
                    },
                  ],
                },
              },
              // Middle: drill name
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column" as const,
                    gap: 24,
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: name.length > 30 ? 56 : 72,
                          fontWeight: 900,
                          color: "white",
                          lineHeight: 1.1,
                          letterSpacing: -1,
                        },
                        children: name,
                      },
                    },
                    // Badges row
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          gap: 12,
                          alignItems: "center",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                backgroundColor: `${diffColor}22`,
                                border: `1.5px solid ${diffColor}55`,
                                borderRadius: 100,
                                padding: "8px 20px",
                                fontSize: 18,
                                fontWeight: 700,
                                color: diffColor,
                              },
                              children: difficulty,
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: {
                                backgroundColor: "rgba(255,255,255,0.06)",
                                border: "1.5px solid rgba(255,255,255,0.12)",
                                borderRadius: 100,
                                padding: "8px 20px",
                                fontSize: 18,
                                fontWeight: 600,
                                color: "#94a3b8",
                              },
                              children: category,
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: {
                                backgroundColor: "rgba(255,255,255,0.04)",
                                border: "1.5px solid rgba(255,255,255,0.08)",
                                borderRadius: 100,
                                padding: "8px 20px",
                                fontSize: 18,
                                fontWeight: 500,
                                color: "#475569",
                              },
                              children: "⚾ Baseball Drill",
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              // Bottom: URL
              {
                type: "div",
                props: {
                  style: {
                    fontSize: 16,
                    color: "#334155",
                    fontWeight: 500,
                    letterSpacing: 1,
                  },
                  children: "coachstevemobilecoach.com",
                },
              },
            ],
          },
        },
      ],
    },
  };

  const svg = await satori(element as any, {
    width: 1200,
    height: 630,
    fonts: [], // satori uses system fonts when no custom fonts provided
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width" as const, value: 1200 },
  });
  return Buffer.from(resvg.render().asPng());
}

export function registerOgRoutes(app: any) {
  const router = Router();

  router.get("/drill/:id", async (req, res) => {
    const drillId = req.params.id;

    try {
      // Check cache
      const cached = imageCache.get(drillId);
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=3600");
        return res.send(cached.png);
      }

      // Get drill metadata
      const meta = await getDrillMeta(drillId);
      const name = meta?.name || `Drill #${drillId}`;
      const difficulty = meta?.difficulty || "Medium";
      const category = meta?.category || "Hitting";

      const png = await generateOgImage(name, difficulty, category);

      // Cache it
      imageCache.set(drillId, { png, ts: Date.now() });

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.send(png);
    } catch (err: any) {
      console.error("[OG Image] Failed to generate for drill", drillId, err.message);
      // Return a minimal fallback 1x1 transparent PNG
      const fallback = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      );
      res.setHeader("Content-Type", "image/png");
      return res.status(200).send(fallback);
    }
  });

  app.use("/api/og", router);
}
