import { useMemo } from "react";
import { trpc } from "@/lib/trpc";

export interface UnifiedDrill {
  id: string;
  name: string;
  difficulty: string;
  categories: string[];
  duration: string;
  url?: string;
  is_direct_link?: boolean;
  isCustom?: boolean;
  ageLevel?: string[];
  tags?: string[];
  problem?: string[];
  goal?: string[];
  drillType?: string;
  problems?: string[];
  outcomes?: string[];
  /** Enriched from drillDetails table */
  instructions?: string | null;
  equipment?: string | null;
}

/**
 * Unified hook that loads all visible drills from the backend database.
 *
 * The backend `drills` table is the single source of truth — it was seeded
 * from the static drills.ts file and will be maintained via the admin UI.
 *
 * Returns an empty array while loading so callers can show skeletons.
 *
 * BACKWARD COMPATIBLE: returns UnifiedDrill[] directly (same as before).
 * Use `useAllDrillsQuery()` if you need access to isLoading / error state.
 */
export function useAllDrills(): UnifiedDrill[] {
  const { data: dbDrills = [] } = trpc.drillsDirectory.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes — drills change infrequently
  });

  return useMemo<UnifiedDrill[]>(() => {
    return dbDrills.map((d) => ({
      id: d.drillId,
      name: d.name,
      difficulty: d.difficulty ?? "Unknown",
      categories: (d.categories as string[]) ?? [],
      duration: d.duration ?? "",
      url: d.url ?? undefined,
      is_direct_link: d.isDirectLink,
      isCustom: d.source === "custom",
      ageLevel: (d.ageLevel as string[] | null) ?? [],
      tags: (d.tags as string[] | null) ?? [],
      problem: (d.problem as string[] | null) ?? [],
      goal: (d.goal as string[] | null) ?? [],
      drillType: d.drillType ?? undefined,
      problems: (d.problems as string[] | null) ?? [],
      outcomes: (d.outcomes as string[] | null) ?? [],
      instructions: null,
      equipment: null,
    }));
  }, [dbDrills]);
}

/**
 * Extended form that also exposes loading / error state.
 * Use this in components that need to show loading skeletons.
 */
export function useAllDrillsQuery(): { drills: UnifiedDrill[]; isLoading: boolean; error: unknown } {
  const { data: dbDrills = [], isLoading, error } = trpc.drillsDirectory.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const drills = useMemo<UnifiedDrill[]>(() => {
    return dbDrills.map((d) => ({
      id: d.drillId,
      name: d.name,
      difficulty: d.difficulty ?? "Unknown",
      categories: (d.categories as string[]) ?? [],
      duration: d.duration ?? "",
      url: d.url ?? undefined,
      is_direct_link: d.isDirectLink,
      isCustom: d.source === "custom",
      ageLevel: (d.ageLevel as string[] | null) ?? [],
      tags: (d.tags as string[] | null) ?? [],
      problem: (d.problem as string[] | null) ?? [],
      goal: (d.goal as string[] | null) ?? [],
      drillType: d.drillType ?? undefined,
      problems: (d.problems as string[] | null) ?? [],
      outcomes: (d.outcomes as string[] | null) ?? [],
      instructions: null,
      equipment: null,
    }));
  }, [dbDrills]);

  return { drills, isLoading, error };
}
