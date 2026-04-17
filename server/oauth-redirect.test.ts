import { describe, it, expect } from "vitest";

/**
 * Tests for the OAuth callback state parsing logic.
 * The state parameter is base64-encoded JSON containing { redirectUri, returnTo }.
 * The server decodes it and redirects to returnTo after successful login.
 */

function parseReturnTo(state: string): string {
  let returnTo = "/";
  try {
    const decoded = Buffer.from(state, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    if (
      parsed.returnTo &&
      typeof parsed.returnTo === "string" &&
      parsed.returnTo.startsWith("/")
    ) {
      returnTo = parsed.returnTo;
    }
  } catch {
    // Old format or invalid state — fall back to homepage
  }
  return returnTo;
}

describe("OAuth state returnTo parsing", () => {
  it("extracts returnTo from valid JSON state", () => {
    const state = btoa(
      JSON.stringify({
        redirectUri: "https://example.com/api/oauth/callback",
        returnTo: "/athlete-portal",
      })
    );
    expect(parseReturnTo(state)).toBe("/athlete-portal");
  });

  it("defaults to / when returnTo is missing", () => {
    const state = btoa(
      JSON.stringify({
        redirectUri: "https://example.com/api/oauth/callback",
      })
    );
    expect(parseReturnTo(state)).toBe("/");
  });

  it("defaults to / when returnTo is not a path (no leading slash)", () => {
    const state = btoa(
      JSON.stringify({
        redirectUri: "https://example.com/api/oauth/callback",
        returnTo: "https://evil.com",
      })
    );
    expect(parseReturnTo(state)).toBe("/");
  });

  it("defaults to / for old-format state (plain base64 string, not JSON)", () => {
    const state = btoa("https://example.com/api/oauth/callback");
    expect(parseReturnTo(state)).toBe("/");
  });

  it("defaults to / for invalid base64", () => {
    expect(parseReturnTo("!!!invalid!!!")).toBe("/");
  });

  it("handles returnTo with nested paths", () => {
    const state = btoa(
      JSON.stringify({
        redirectUri: "https://example.com/api/oauth/callback",
        returnTo: "/athlete-portal?tab=drills",
      })
    );
    expect(parseReturnTo(state)).toBe("/athlete-portal?tab=drills");
  });

  it("rejects returnTo that is not a string", () => {
    const state = btoa(
      JSON.stringify({
        redirectUri: "https://example.com/api/oauth/callback",
        returnTo: 42,
      })
    );
    expect(parseReturnTo(state)).toBe("/");
  });
});
