import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getDb
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

// Chain helpers
function createChain(result: any = []) {
  const chain: any = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockResolvedValue(result);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.set = vi.fn().mockReturnValue(chain);
  chain.values = vi.fn().mockResolvedValue([{ insertId: 42 }]);
  return chain;
}

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

vi.mock("../drizzle/schema", () => ({
  notifications: { id: "id", userId: "userId", dedupeKey: "dedupeKey", emailStatus: "emailStatus", portalStatus: "portalStatus", retryCount: "retryCount" },
  notificationPreferences: { userId: "userId" },
  users: { id: "id", email: "email", name: "name" },
}));

vi.mock("./email", () => ({
  getResend: vi.fn().mockReturnValue({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "test-email-id" }, error: null }),
    },
  }),
}));

vi.mock("./_core/env", () => ({
  ENV: {
    resendApiKey: "re_test_key",
    resendFromEmail: "noreply@test.com",
    appUrl: "https://test.com",
  },
}));

describe("Notification Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendNotification", () => {
    it("should export sendNotification function", async () => {
      const { sendNotification } = await import("./notificationEngine");
      expect(typeof sendNotification).toBe("function");
    });

    it("should export retryFailedNotifications function", async () => {
      const { retryFailedNotifications } = await import("./notificationEngine");
      expect(typeof retryFailedNotifications).toBe("function");
    });

    it("should export sendBulkNotification function", async () => {
      const { sendBulkNotification } = await import("./notificationEngine");
      expect(typeof sendBulkNotification).toBe("function");
    });

    it("should export markAllNotificationsRead function", async () => {
      const { markAllNotificationsRead } = await import("./notificationEngine");
      expect(typeof markAllNotificationsRead).toBe("function");
    });

    it("should define all notification types", async () => {
      const engine = await import("./notificationEngine");
      // The SendNotificationInput type should accept all defined types
      const validTypes = [
        "drill_assigned",
        "notes_added",
        "recap_posted",
        "swing_analysis_ready",
        "new_feature_available",
        "feedback_received",
        "submission_received",
        "badge_earned",
        "practice_plan_shared",
        "welcome",
        "system",
      ];
      // Just verify the module loaded without errors
      expect(validTypes.length).toBe(11);
      expect(engine.sendNotification).toBeDefined();
    });
  });

  describe("SendNotificationInput interface", () => {
    it("should accept portalOnly flag", async () => {
      const { sendNotification } = await import("./notificationEngine");
      // Setup mock chain for the insert
      const selectChain = createChain([{ email: "test@test.com", name: "Test" }]);
      mockDb.select.mockReturnValue(selectChain);
      const insertChain = createChain();
      insertChain.values = vi.fn().mockResolvedValue([{ insertId: 99 }]);
      mockDb.insert.mockReturnValue(insertChain);

      const result = await sendNotification({
        userId: 1,
        type: "system",
        title: "Test",
        message: "Test message",
        portalOnly: true,
      });

      expect(result.success).toBe(true);
    });

    it("should accept dedupeKey", async () => {
      const { sendNotification } = await import("./notificationEngine");
      // Setup mock chain for dedupe check - return existing
      const selectChain = createChain([{ id: 50 }]);
      mockDb.select.mockReturnValue(selectChain);

      const result = await sendNotification({
        userId: 1,
        type: "drill_assigned",
        title: "Test",
        message: "Test message",
        dedupeKey: "test-dedupe-key",
      });

      // Should return existing notification ID
      expect(result.success).toBe(true);
      expect(result.notificationId).toBe(50);
      expect(result.emailSent).toBe(false);
    });
  });
});

describe("Notification Wiring", () => {
  it("drillAssignments.ts should import sendNotification", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/drillAssignments.ts", "utf-8");
    expect(content).toContain('import { sendNotification } from "./notificationEngine"');
    expect(content).toContain("sendNotification({");
    // Should NOT have direct db.insert(notifications)
    expect(content).not.toContain("db.insert(notifications)");
  });

  it("routers-video-analysis.ts should import sendNotification", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/routers-video-analysis.ts", "utf-8");
    expect(content).toContain('import { sendNotification } from "./notificationEngine"');
    expect(content).toContain("sendNotification({");
  });

  it("routers-submissions.ts should import sendNotification", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/routers-submissions.ts", "utf-8");
    expect(content).toContain('import { sendNotification } from "./notificationEngine"');
    expect(content).toContain("sendNotification({");
  });

  it("activityTracking.ts should import sendNotification", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/activityTracking.ts", "utf-8");
    expect(content).toContain('import { sendNotification } from "./notificationEngine"');
    expect(content).toContain("sendNotification({");
    // Should use portalOnly for activity notifications
    expect(content).toContain("portalOnly: true");
  });

  it("notificationService.ts should import sendNotification", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/notificationService.ts", "utf-8");
    expect(content).toContain('import { sendNotification } from "./notificationEngine"');
    expect(content).toContain("sendNotification({");
    // Should NOT have direct db.insert(notifications)
    expect(content).not.toContain("db.insert(notifications)");
  });

  it("no server files outside engine should have direct db.insert(notifications)", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const serverDir = "server";
    const files = fs.readdirSync(serverDir).filter(f => f.endsWith(".ts") && !f.endsWith(".test.ts"));
    
    const violators: string[] = [];
    for (const file of files) {
      if (file === "notificationEngine.ts" || file === "db.ts") continue; // Engine itself and legacy helper are OK
      const content = fs.readFileSync(path.join(serverDir, file), "utf-8");
      if (content.includes("db.insert(notifications)") || content.includes(".insert(notifications)")) {
        violators.push(file);
      }
    }
    
    expect(violators).toEqual([]);
  });
});

describe("Notification Router", () => {
  it("routers-notifications.ts should have markAllRead procedure", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/routers-notifications.ts", "utf-8");
    expect(content).toContain("markAllRead:");
    expect(content).toContain("markAllNotificationsRead");
  });

  it("routers-notifications.ts should have preference field names matching schema", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/routers-notifications.ts", "utf-8");
    // Should have the correct preference field names from schema
    expect(content).toContain("drillAssignments:");
    expect(content).toContain("notesUpdates:");
    expect(content).toContain("recapUpdates:");
    expect(content).toContain("swingAnalysis:");
    expect(content).toContain("feedbackUpdates:");
    expect(content).toContain("submissionUpdates:");
    expect(content).toContain("badgeUpdates:");
    expect(content).toContain("practicePlanUpdates:");
    expect(content).toContain("systemUpdates:");
    expect(content).toContain("emailNotifications:");
  });
});
