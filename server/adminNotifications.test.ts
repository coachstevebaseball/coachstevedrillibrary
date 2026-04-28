import { describe, expect, it, vi, beforeEach } from "vitest";

// ─── Mock the dependencies ──────────────────────────────────────────────────

// Mock getDb
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// Mock sendNotification
vi.mock("./notificationEngine", () => ({
  sendNotification: vi.fn(),
}));

// Mock drizzle-orm
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: any, val: any) => ({ col, val })),
}));

// Mock schema
vi.mock("../drizzle/schema", () => ({
  users: {
    id: "id",
    email: "email",
    name: "name",
    role: "role",
  },
}));

import { getDb } from "./db";
import { sendNotification } from "./notificationEngine";
import {
  notifyAdminInviteAccepted,
  notifyAdminFirstLogin,
  notifyAdminDrillComplete,
  notifyAdminNoteLeft,
} from "./adminNotifications";

describe("adminNotifications", () => {
  const mockAdmin = { id: 1, email: "coach@example.com", name: "Coach Steve" };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: getDb returns a mock db that finds the admin
    (getDb as any).mockResolvedValue({
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([mockAdmin]),
          }),
        }),
      }),
    });

    (sendNotification as any).mockResolvedValue({
      success: true,
      notificationId: 42,
      emailSent: true,
    });
  });

  // ── notifyAdminInviteAccepted ──────────────────────────────────────────

  describe("notifyAdminInviteAccepted", () => {
    it("sends a system notification to admin with athlete details", async () => {
      await notifyAdminInviteAccepted("John Doe", "john@example.com");

      expect(sendNotification).toHaveBeenCalledTimes(1);
      const call = (sendNotification as any).mock.calls[0][0];
      expect(call.userId).toBe(1);
      expect(call.type).toBe("system");
      expect(call.title).toBe("Athlete Accepted Invite");
      expect(call.message).toContain("John Doe");
      expect(call.message).toContain("john@example.com");
      expect(call.recipientEmail).toBe("coach@example.com");
      expect(call.linkUrl).toBe("/coach-dashboard");
    });

    it("does nothing when no admin user exists", async () => {
      (getDb as any).mockResolvedValue({
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([]),
            }),
          }),
        }),
      });

      await notifyAdminInviteAccepted("John Doe", "john@example.com");
      expect(sendNotification).not.toHaveBeenCalled();
    });

    it("does nothing when database is unavailable", async () => {
      (getDb as any).mockResolvedValue(null);

      await notifyAdminInviteAccepted("John Doe", "john@example.com");
      expect(sendNotification).not.toHaveBeenCalled();
    });
  });

  // ── notifyAdminFirstLogin ──────────────────────────────────────────────

  describe("notifyAdminFirstLogin", () => {
    it("sends first-login notification with deduplication key", async () => {
      await notifyAdminFirstLogin("Jane Smith", "jane@example.com");

      expect(sendNotification).toHaveBeenCalledTimes(1);
      const call = (sendNotification as any).mock.calls[0][0];
      expect(call.title).toBe("Athlete First Login");
      expect(call.message).toContain("Jane Smith");
      expect(call.dedupeKey).toBe("first-login-jane@example.com");
    });
  });

  // ── notifyAdminDrillComplete ───────────────────────────────────────────

  describe("notifyAdminDrillComplete", () => {
    it("sends drill completion notification with drill name", async () => {
      await notifyAdminDrillComplete("Mike Johnson", "mike@example.com", "1-2-3 Drill");

      expect(sendNotification).toHaveBeenCalledTimes(1);
      const call = (sendNotification as any).mock.calls[0][0];
      expect(call.title).toBe("Drill Completed");
      expect(call.message).toContain("Mike Johnson");
      expect(call.message).toContain("1-2-3 Drill");
    });
  });

  // ── notifyAdminNoteLeft ────────────────────────────────────────────────

  describe("notifyAdminNoteLeft", () => {
    it("sends note notification with preview", async () => {
      await notifyAdminNoteLeft(
        "Alex Player",
        "alex@example.com",
        "Bunting Drill",
        "This drill was really helpful for my stance!"
      );

      expect(sendNotification).toHaveBeenCalledTimes(1);
      const call = (sendNotification as any).mock.calls[0][0];
      expect(call.title).toBe("Athlete Left a Note");
      expect(call.message).toContain("Alex Player");
      expect(call.message).toContain("Bunting Drill");
      expect(call.message).toContain("This drill was really helpful");
    });

    it("truncates long notes to 200 characters", async () => {
      const longNote = "A".repeat(300);
      await notifyAdminNoteLeft("Alex Player", "alex@example.com", "Drill X", longNote);

      const call = (sendNotification as any).mock.calls[0][0];
      // The note preview in the message should be truncated
      expect(call.message).toContain("A".repeat(200) + "…");
    });
  });

  // ── Error handling ─────────────────────────────────────────────────────

  describe("error handling", () => {
    it("catches and logs errors without throwing", async () => {
      (sendNotification as any).mockRejectedValue(new Error("Email service down"));

      // Should not throw
      await expect(
        notifyAdminDrillComplete("Test", "test@example.com", "Drill")
      ).resolves.toBeUndefined();
    });
  });
});
