import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getUserByOpenId: vi.fn(),
    getChildrenByParent: vi.fn(),
    getDb: vi.fn().mockResolvedValue(null),
  };
});

import { getUserByOpenId, getChildrenByParent } from "./db";

function createContext(user: TrpcContext["user"] = null): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no user is logged in", async () => {
    const ctx = createContext(null);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user with hasChildren=true when user has children", async () => {
    const mockUser = {
      id: 10,
      openId: "test-open-id",
      email: "parent@example.com",
      name: "Parent User",
      role: "athlete",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    (getUserByOpenId as any).mockResolvedValue(mockUser);
    (getChildrenByParent as any).mockResolvedValue([
      { id: 20, name: "Child 1", parentId: 10 },
    ]);

    const ctx = createContext({
      id: 10,
      openId: "test-open-id",
      email: "parent@example.com",
      name: "Parent User",
      loginMethod: "manus",
      role: "athlete",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();

    expect(result).toBeDefined();
    expect((result as any).hasChildren).toBe(true);
    expect(getChildrenByParent).toHaveBeenCalledWith(10);
  });

  it("returns user with hasChildren=false when user has no children", async () => {
    const mockUser = {
      id: 11,
      openId: "test-open-id-2",
      email: "solo@example.com",
      name: "Solo Athlete",
      role: "athlete",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    (getUserByOpenId as any).mockResolvedValue(mockUser);
    (getChildrenByParent as any).mockResolvedValue([]);

    const ctx = createContext({
      id: 11,
      openId: "test-open-id-2",
      email: "solo@example.com",
      name: "Solo Athlete",
      loginMethod: "manus",
      role: "athlete",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();

    expect(result).toBeDefined();
    expect((result as any).hasChildren).toBe(false);
  });
});
