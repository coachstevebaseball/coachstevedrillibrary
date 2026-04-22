import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the autoMarkOldNotificationsRead function logic
// by mocking the database layer

describe("autoMarkOldNotificationsRead", () => {
  it("should be importable from notificationEngine", async () => {
    const mod = await import("./notificationEngine");
    expect(typeof mod.autoMarkOldNotificationsRead).toBe("function");
  });

  it("should return { marked: 0 } when db is unavailable", async () => {
    // Mock getDb to return null
    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue(null),
    }));

    // Re-import to pick up mock
    const { autoMarkOldNotificationsRead } = await import("./notificationEngine");
    const result = await autoMarkOldNotificationsRead();
    expect(result).toEqual({ marked: 0 });

    vi.doUnmock("./db");
  });
});
