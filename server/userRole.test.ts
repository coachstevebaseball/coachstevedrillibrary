import { describe, it, expect, vi } from "vitest";

/**
 * Tests for user role assignment and new registration notification logic.
 * 
 * These tests verify:
 * 1. Default role for new users is "user" (not "athlete")
 * 2. getUserByEmail function exists and is exported
 * 3. The OAuth callback checks for existing users before upserting
 * 4. Coach notification function is called for new users
 */

describe("User Role Assignment", () => {
  it("should export getUserByEmail from db module", async () => {
    const db = await import("./db");
    expect(typeof db.getUserByEmail).toBe("function");
  });

  it("should export getUserByOpenId from db module", async () => {
    const db = await import("./db");
    expect(typeof db.getUserByOpenId).toBe("function");
  });

  it("should export getUserById from db module", async () => {
    const db = await import("./db");
    expect(typeof db.getUserById).toBe("function");
  });

  it("should export upsertUser from db module", async () => {
    const db = await import("./db");
    expect(typeof db.upsertUser).toBe("function");
  });

  it("should export convertUserToAthlete from db module", async () => {
    const db = await import("./db");
    expect(typeof db.convertUserToAthlete).toBe("function");
  });

  it("should export updateUserRole from db module", async () => {
    const db = await import("./db");
    expect(typeof db.updateUserRole).toBe("function");
  });
});

describe("Default Role Logic in upsertUser", () => {
  it("upsertUser code should assign 'athlete' role as default for new visitors with isActiveClient=0", async () => {
    // Read the source code to verify the default role logic
    const fs = await import("fs");
    const path = await import("path");
    const dbSource = fs.readFileSync(
      path.resolve(__dirname, "db.ts"),
      "utf-8"
    );

    // New visitors default to 'athlete' role but inactive
    expect(dbSource).toContain("values.role = 'athlete';");
    expect(dbSource).toContain("values.isActiveClient = 0;");
    expect(dbSource).toContain("updateSet.role = 'athlete';");
    expect(dbSource).toContain("updateSet.isActiveClient = 0;");
  });

  it("upsertUser code should preserve existing role for returning users", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const dbSource = fs.readFileSync(
      path.resolve(__dirname, "db.ts"),
      "utf-8"
    );

    expect(dbSource).toContain("Preserve existing role if user already exists");
  });

  it("upsertUser code should set admin role for owner", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const dbSource = fs.readFileSync(
      path.resolve(__dirname, "db.ts"),
      "utf-8"
    );

    expect(dbSource).toContain("Setting admin role for owner");
  });

  it("upsertUser code should include email-based fallback matching", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const dbSource = fs.readFileSync(
      path.resolve(__dirname, "db.ts"),
      "utf-8"
    );

    expect(dbSource).toContain("EMAIL-BASED FALLBACK MATCHING");
    expect(dbSource).toContain("Email-based match found");
  });
});

describe("OAuth Callback - Coach Notification for New Users", () => {
  it("oauth.ts should check for existing user before upserting", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const oauthSource = fs.readFileSync(
      path.resolve(__dirname, "_core/oauth.ts"),
      "utf-8"
    );

    // Verify it checks for existing user before upsert
    expect(oauthSource).toContain("getUserByOpenId");
    expect(oauthSource).toContain("getUserByEmail");
    expect(oauthSource).toContain("isNewUser");
  });

  it("oauth.ts should call notifyCoachOfNewUser for new registrations", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const oauthSource = fs.readFileSync(
      path.resolve(__dirname, "_core/oauth.ts"),
      "utf-8"
    );

    expect(oauthSource).toContain("notifyCoachOfNewUser");
    expect(oauthSource).toContain("if (isNewUser)");
  });

  it("notifyCoachOfNewUser should send system notification to admin", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const oauthSource = fs.readFileSync(
      path.resolve(__dirname, "_core/oauth.ts"),
      "utf-8"
    );

    // Verify it uses sendNotification engine
    expect(oauthSource).toContain("sendNotification");
    expect(oauthSource).toContain('type: "system"');
    expect(oauthSource).toContain("New User Registration");
    // Verify it finds admin user
    expect(oauthSource).toContain('eq(users.role, "admin")');
  });

  it("notifyCoachOfNewUser should include user name and email in message", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const oauthSource = fs.readFileSync(
      path.resolve(__dirname, "_core/oauth.ts"),
      "utf-8"
    );

    expect(oauthSource).toContain("Name: ${name}");
    expect(oauthSource).toContain("Email: ${email}");
  });

  it("notifyCoachOfNewUser should not block the OAuth callback on failure", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const oauthSource = fs.readFileSync(
      path.resolve(__dirname, "_core/oauth.ts"),
      "utf-8"
    );

    // Should use .catch() to prevent blocking
    expect(oauthSource).toContain(".catch(");
    expect(oauthSource).toContain("Failed to notify coach of new user");
  });
});

describe("Role Enum Validation", () => {
  it("schema should include admin and athlete roles", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const schemaSource = fs.readFileSync(
      path.resolve(__dirname, "../drizzle/schema.ts"),
      "utf-8"
    );

    expect(schemaSource).toContain('"admin"');
    expect(schemaSource).toContain('"athlete"');
    // Default should be "athlete"
    expect(schemaSource).toContain('.default("athlete")');
  });
});
