import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import drillsData from "@/data/drills.json";

export interface UnifiedDrill {
  id: string;
  name: string;
  difficulty: string;
  categories: string[];
  duration: string;
  url?: string;
  is_direct_link?: boolean;
  isCustom?: boolean;
}

/**
 * Shared hook that merges static drills (from drills.json) with custom drills
 * (from the database) and returns them sorted alphabetically by name.
 *
 * Use this everywhere drills are listed to ensure custom drills are interleaved
 * with built-in drills rather than appended at the end.
 */
export function useAllDrills(): UnifiedDrill[] {
  const { data: customDrills = [] } = trpc.drillDetails.getCustomDrills.useQuery();

  return useMemo(() => {
    const staticDrills: UnifiedDrill[] = drillsData.map((d) => ({
      id: String(d.id),
      name: d.name,
      difficulty: d.difficulty,
      categories: d.categories,
      duration: d.duration,
      url: d.url,
      is_direct_link: d.is_direct_link,
      isCustom: false,
    }));

    // Only include Hitting custom drills (platform is hitting-focused)
    const hittingCustomDrills = customDrills.filter((cd: any) => cd.category === "Hitting");

    const customDrillsFormatted: UnifiedDrill[] = hittingCustomDrills.map((cd: any) => ({
      id: cd.drillId,
      name: cd.name,
      difficulty: cd.difficulty,
      categories: [cd.category],
      duration: cd.duration,
      url: `/drill/${cd.drillId}`,
      is_direct_link: true,
      isCustom: true,
    }));

    // Merge and sort alphabetically by name (case-insensitive)
    return [...staticDrills, ...customDrillsFormatted].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [customDrills]);
}
