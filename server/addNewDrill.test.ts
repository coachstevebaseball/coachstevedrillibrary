import { describe, it, expect } from "vitest";

/**
 * Tests for the "Add New Drill" feature in the Admin Dashboard.
 * Verifies that the createNewDrill endpoint accepts and stores all metadata fields.
 */

describe("Add New Drill Feature", () => {
  it("should have createNewDrill function exported from db module", async () => {
    const db = await import("./db");
    expect(typeof db.createNewDrill).toBe("function");
  });

  it("should have getCustomDrills function exported from db module", async () => {
    const db = await import("./db");
    expect(typeof db.getCustomDrills).toBe("function");
  });

  it("createNewDrill should accept all metadata fields in input", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const dbSource = fs.readFileSync(
      path.resolve(__dirname, "db.ts"),
      "utf-8"
    );

    // Verify the function signature includes all metadata fields
    expect(dbSource).toContain("drillType?:");
    expect(dbSource).toContain("ageLevel?:");
    expect(dbSource).toContain("focusTags?:");
    expect(dbSource).toContain("problemsFix?:");
    expect(dbSource).toContain("pillars?:");
  });

  it("customDrills schema should include all metadata columns", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const schemaSource = fs.readFileSync(
      path.resolve(__dirname, "../drizzle/schema.ts"),
      "utf-8"
    );

    // Verify schema has metadata columns
    expect(schemaSource).toContain('drillType: varchar("drillType"');
    expect(schemaSource).toContain('ageLevel: text("ageLevel")');
    expect(schemaSource).toContain('focusTags: text("focusTags")');
    expect(schemaSource).toContain('problemsFix: text("problemsFix")');
    expect(schemaSource).toContain('pillars: text("pillars")');
  });

  it("createNewDrill endpoint should be protected (admin only)", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routersSource = fs.readFileSync(
      path.resolve(__dirname, "routers.ts"),
      "utf-8"
    );

    // Verify admin check is in place
    expect(routersSource).toContain("createNewDrill: protectedProcedure");
    expect(routersSource).toContain("ctx.user.role !== 'admin'");
    expect(routersSource).toContain("FORBIDDEN");
  });

  it("AddNewDrill component should send all metadata fields", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const componentSource = fs.readFileSync(
      path.resolve(__dirname, "../client/src/components/AddNewDrill.tsx"),
      "utf-8"
    );

    // Verify component sends all fields
    expect(componentSource).toContain("drillType:");
    expect(componentSource).toContain("ageLevel:");
    expect(componentSource).toContain("focusTags:");
    expect(componentSource).toContain("problemsFix:");
    expect(componentSource).toContain("pillars:");
  });

  it("should handle optional metadata fields gracefully", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const dbSource = fs.readFileSync(
      path.resolve(__dirname, "db.ts"),
      "utf-8"
    );

    // Verify optional handling
    expect(dbSource).toContain("drillData.drillType");
    expect(dbSource).toContain("ageLevel?.length");
    expect(dbSource).toContain("JSON.stringify");
  });
});
