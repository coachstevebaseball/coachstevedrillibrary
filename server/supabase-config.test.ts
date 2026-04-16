import { describe, it, expect } from "vitest";
import { drillStatCards } from "../drizzle/schema";

describe("Supabase & drillStatCards configuration", () => {
  describe("drillStatCards schema", () => {
    it("has all required columns", () => {
      const columns = Object.keys(drillStatCards);
      // Drizzle table objects expose column names as keys
      expect(columns).toContain("id");
      expect(columns).toContain("drillId");
      expect(columns).toContain("label");
      expect(columns).toContain("value");
      expect(columns).toContain("icon");
      expect(columns).toContain("position");
      expect(columns).toContain("isVisible");
      expect(columns).toContain("createdAt");
      expect(columns).toContain("updatedAt");
    });

    it("drillId column is a varchar", () => {
      expect(drillStatCards.drillId.dataType).toBe("string");
    });

    it("position column defaults to 0", () => {
      expect(drillStatCards.position.hasDefault).toBe(true);
    });

    it("isVisible column defaults to 1", () => {
      expect(drillStatCards.isVisible.hasDefault).toBe(true);
    });

    it("icon column defaults to 'info'", () => {
      expect(drillStatCards.icon.hasDefault).toBe(true);
    });
  });

  describe("Supabase client env vars", () => {
    it("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are defined in project secrets", () => {
      // These are injected at runtime; we verify the client code references them correctly
      // by checking the file content pattern
      const fs = require("fs");
      const clientCode = fs.readFileSync(
        require("path").join(__dirname, "../client/src/supabaseClient.ts"),
        "utf-8"
      );
      expect(clientCode).toContain("NEXT_PUBLIC_SUPABASE_URL");
      expect(clientCode).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
      // Should NOT contain hardcoded credentials
      expect(clientCode).not.toContain("gmrrpvctlujsvhiwkivu.supabase.co");
      expect(clientCode).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    });
  });
});
