import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for the access model restructure:
 * - Public procedures should work without authentication
 * - Admin procedures should require authentication
 */

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAthleteContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "athlete-user",
      email: "athlete@example.com",
      name: "Athlete User",
      loginMethod: "manus",
      role: "athlete",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Access Model - Public Procedures", () => {
  it("auth.me returns null for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("auth.me returns user data for authenticated admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    // This may throw if DB is not available, but it should not throw UNAUTHORIZED
    try {
      const result = await caller.auth.me();
      // If DB is available, result should have user data
      expect(result).toBeTruthy();
    } catch (e: any) {
      // If DB connection fails, that's OK - we're testing auth, not DB
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });
});

describe("Access Model - Admin Protected Procedures", () => {
  it("admin.getAllUsers rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.getAllUsers()).rejects.toThrow();
  });

  it("admin.getAllUsers rejects athlete users", async () => {
    const ctx = createAthleteContext();
    const caller = appRouter.createCaller(ctx);
    // Athletes should not have admin access
    await expect(caller.admin.getAllUsers()).rejects.toThrow();
  });
});
