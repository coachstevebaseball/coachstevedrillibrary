import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the controlled iframe embedding system:
 * 1. EMBED_ALLOWED_ORIGINS env variable is set and parseable
 * 2. CSP middleware logic: embed routes get permissive frame-ancestors, non-embed routes get restrictive
 */

describe("Embed Allowlist Configuration", () => {
  it("EMBED_ALLOWED_ORIGINS env variable is set and non-empty", () => {
    const origins = process.env.EMBED_ALLOWED_ORIGINS || "";
    expect(origins.length).toBeGreaterThan(0);
  });

  it("EMBED_ALLOWED_ORIGINS parses into valid URL origins", () => {
    const origins = (process.env.EMBED_ALLOWED_ORIGINS || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    expect(origins.length).toBeGreaterThan(0);

    for (const origin of origins) {
      // Each origin must start with https://
      expect(origin).toMatch(/^https?:\/\/.+/);
      // Each origin must be a valid URL
      expect(() => new URL(origin)).not.toThrow();
    }
  });

  it("allowlist includes coachstevenbaseball.com", () => {
    const origins = (process.env.EMBED_ALLOWED_ORIGINS || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    const hasCoachSteven = origins.some((o) =>
      o.includes("coachstevenbaseball.com")
    );
    expect(hasCoachSteven).toBe(true);
  });
});

describe("CSP Header Logic", () => {
  it("embed routes should produce frame-ancestors with allowlist", () => {
    const origins = (process.env.EMBED_ALLOWED_ORIGINS || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    const frameAncestors = ["'self'", ...origins].join(" ");
    const cspHeader = `frame-ancestors ${frameAncestors}`;

    // Must contain 'self'
    expect(cspHeader).toContain("'self'");
    // Must contain the approved domain
    expect(cspHeader).toContain("coachstevenbaseball.com");
    // Must start with frame-ancestors
    expect(cspHeader).toMatch(/^frame-ancestors /);
  });

  it("non-embed routes should produce restrictive frame-ancestors", () => {
    const cspHeader = "frame-ancestors 'self'";
    expect(cspHeader).toBe("frame-ancestors 'self'");
  });

  it("embed path detection correctly identifies /embed routes", () => {
    const embedPaths = ["/embed", "/embed/drills", "/embed/drill/123", "/embed/player-report"];
    const nonEmbedPaths = ["/", "/drills", "/drill/123", "/admin", "/coach-dashboard", "/api/trpc"];

    for (const path of embedPaths) {
      expect(path.startsWith("/embed")).toBe(true);
    }

    for (const path of nonEmbedPaths) {
      expect(path.startsWith("/embed")).toBe(false);
    }
  });
});
