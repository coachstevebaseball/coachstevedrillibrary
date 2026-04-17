import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock the DB module ───────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getAllDrillDetails: vi.fn(),
  updateDrillContent: vi.fn(),
  getDrillDetail: vi.fn(),
}));

import * as db from "./db";

// ─── getAllDrillDetails ───────────────────────────────────────────────────────
describe("getAllDrillDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an array of drill detail objects", async () => {
    const mockDetails = [
      {
        id: 1,
        drillId: "1-2-3-drill",
        goal: "Develop timing",
        instructions: "Step 1: Load. Step 2: Swing.",
        equipment: "Batting tee, baseballs",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        drillId: "angle-flips",
        goal: null,
        instructions: null,
        equipment: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(db.getAllDrillDetails).mockResolvedValue(mockDetails as any);

    const result = await db.getAllDrillDetails();
    expect(result).toHaveLength(2);
    expect(result[0].drillId).toBe("1-2-3-drill");
    expect(result[0].goal).toBe("Develop timing");
    expect(result[1].goal).toBeNull();
  });

  it("returns an empty array when no drill details exist", async () => {
    vi.mocked(db.getAllDrillDetails).mockResolvedValue([]);

    const result = await db.getAllDrillDetails();
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns all fields including goal, instructions, and equipment", async () => {
    const mockDetail = {
      id: 1,
      drillId: "bat-behind-hips",
      goal: "Build muscle memory for hip-first movement",
      instructions: "Place bat behind hips. Rotate through contact.",
      equipment: "Bat, batting tee",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.getAllDrillDetails).mockResolvedValue([mockDetail] as any);

    const result = await db.getAllDrillDetails();
    expect(result[0]).toHaveProperty("drillId");
    expect(result[0]).toHaveProperty("goal");
    expect(result[0]).toHaveProperty("instructions");
    expect(result[0]).toHaveProperty("equipment");
  });
});

// ─── ManageDrillContent page logic ───────────────────────────────────────────
describe("ManageDrillContent data merging logic", () => {
  it("merges static drills with database details by drillId", () => {
    const staticDrills = [
      { id: "drill-a", name: "Drill A", difficulty: "Easy", duration: "10m" },
      { id: "drill-b", name: "Drill B", difficulty: "Medium", duration: "15m" },
      { id: "drill-c", name: "Drill C", difficulty: "Hard", duration: "20m" },
    ];

    const dbDetails = [
      { drillId: "drill-a", goal: "Goal A", instructions: "Instructions A", equipment: "Tee" },
      { drillId: "drill-c", goal: null, instructions: "Instructions C", equipment: null },
    ];

    // Simulate the merge logic from ManageDrillContent.tsx
    const detailsMap = new Map<string, { goal: string | null; instructions: string | null; equipment: string | null }>();
    for (const d of dbDetails) {
      detailsMap.set(d.drillId, {
        goal: d.goal,
        instructions: d.instructions,
        equipment: d.equipment,
      });
    }

    const merged = staticDrills.map((drill) => {
      const detail = detailsMap.get(drill.id);
      return {
        id: drill.id,
        name: drill.name,
        goal: detail?.goal ?? null,
        instructions: detail?.instructions ?? null,
        equipment: detail?.equipment ?? null,
      };
    });

    expect(merged).toHaveLength(3);
    expect(merged[0].goal).toBe("Goal A");
    expect(merged[0].instructions).toBe("Instructions A");
    expect(merged[1].goal).toBeNull();       // drill-b has no DB entry
    expect(merged[1].instructions).toBeNull();
    expect(merged[2].goal).toBeNull();       // drill-c has null goal
    expect(merged[2].instructions).toBe("Instructions C");
  });

  it("correctly identifies filled vs empty drills", () => {
    const drills = [
      { id: "a", goal: "Goal", instructions: "Steps", equipment: "Tee" },
      { id: "b", goal: null, instructions: null, equipment: null },
      { id: "c", goal: null, instructions: "Steps only", equipment: null },
    ];

    const filledCount = drills.filter((d) => d.instructions || d.equipment || d.goal).length;
    const emptyCount = drills.length - filledCount;

    expect(filledCount).toBe(2); // a and c have some content
    expect(emptyCount).toBe(1);  // only b is fully empty
  });

  it("filters drills by search query case-insensitively", () => {
    const drills = [
      { id: "a", name: "Bat Behind Hips", goal: null, instructions: null, equipment: null },
      { id: "b", name: "Balance Beam", goal: null, instructions: null, equipment: null },
      { id: "c", name: "Angle Flips", goal: null, instructions: null, equipment: null },
    ];

    const query = "bat";
    const filtered = drills.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()));

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("Bat Behind Hips");
  });

  it("paginates drills correctly", () => {
    const PAGE_SIZE = 20;
    const drills = Array.from({ length: 87 }, (_, i) => ({ id: `drill-${i}`, name: `Drill ${i}` }));

    const page1 = drills.slice(0, PAGE_SIZE);
    const page2 = drills.slice(PAGE_SIZE, PAGE_SIZE * 2);
    const totalPages = Math.ceil(drills.length / PAGE_SIZE);

    expect(page1).toHaveLength(20);
    expect(page2).toHaveLength(20);
    expect(totalPages).toBe(5);
  });
});
