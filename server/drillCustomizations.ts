import { drizzle } from "drizzle-orm/mysql2";
import { drillCustomizations, DrillCustomization, InsertDrillCustomization } from "../drizzle/schema";
import { eq } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;

async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Get customization for a specific drill
export async function getDrillCustomization(drillId: string): Promise<DrillCustomization | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(drillCustomizations)
    .where(eq(drillCustomizations.drillId, drillId))
    .limit(1);

  return result[0] || null;
}

// Get all drill customizations
export async function getAllDrillCustomizations(): Promise<DrillCustomization[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(drillCustomizations);
}

// Create or update drill customization
export async function upsertDrillCustomization(
  drillId: string,
  data: {
    thumbnailUrl?: string | null;
    imageBase64?: string | null;
    imageMimeType?: string | null;
    briefDescription?: string | null;
    difficulty?: string | null;
    category?: string | null;
  },
  updatedBy: number
): Promise<DrillCustomization | null> {
  const db = await getDb();
  if (!db) return null;

  // Check if customization exists
  const existing = await getDrillCustomization(drillId);

  if (existing) {
    // Update existing
    await db
      .update(drillCustomizations)
      .set({
        thumbnailUrl: data.thumbnailUrl ?? existing.thumbnailUrl,
        imageBase64: data.imageBase64 ?? existing.imageBase64,
        imageMimeType: data.imageMimeType ?? existing.imageMimeType,
        briefDescription: data.briefDescription ?? existing.briefDescription,
        difficulty: data.difficulty ?? existing.difficulty,
        category: data.category ?? existing.category,
        updatedBy,
      })
      .where(eq(drillCustomizations.drillId, drillId));
  } else {
    // Insert new
    await db.insert(drillCustomizations).values({
      drillId,
      thumbnailUrl: data.thumbnailUrl || null,
      imageBase64: data.imageBase64 || null,
      imageMimeType: data.imageMimeType || null,
      briefDescription: data.briefDescription || null,
      difficulty: data.difficulty || null,
      category: data.category || null,
      updatedBy,
    });
  }

  return await getDrillCustomization(drillId);
}

// Delete drill customization
export async function deleteDrillCustomization(drillId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .delete(drillCustomizations)
    .where(eq(drillCustomizations.drillId, drillId));

  return true;
}
