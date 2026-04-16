import { useMemo, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import drillsData from "@/data/drills";
import { supabase } from "@/supabaseClient";

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
  /** Enriched from Supabase */
  instructions?: string | null;
  equipment?: string | null;
  supabaseId?: number;
}

/**
 * Shared hook that merges:
 * 1. Static drills (from drills.ts) — rich filter metadata (tags, ageLevel, problem, goal, drillType)
 * 2. Custom drills (from the database via tRPC) — user-created drills
 * 3. Supabase drills — enrichment data (instructions, equipment, video_url)
 *
 * Static drills are matched to Supabase rows by title for enrichment.
 * Use this everywhere drills are listed to ensure all sources are merged.
 */
export function useAllDrills(): UnifiedDrill[] {
  const { data: customDrills = [] } = trpc.drillDetails.getCustomDrills.useQuery();

  // Fetch Supabase drills for enrichment
  const [supabaseDrills, setSupabaseDrills] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchSupabase() {
      try {
        const { data, error } = await supabase
          .from("drills")
          .select("id,title,instructions,equipment,video_url,difficulty_level,skill_category,duration_minutes,goal_of_drill");

        if (!cancelled && data && !error) {
          setSupabaseDrills(data);
        }
      } catch {
        // Supabase enrichment is optional — fail silently
      }
    }

    fetchSupabase();
    return () => { cancelled = true; };
  }, []);

  return useMemo(() => {
    // Build a lookup map from Supabase drills by normalized title
    const supabaseByTitle = new Map<string, any>();
    for (const sd of supabaseDrills) {
      if (sd.title) {
        supabaseByTitle.set(sd.title.toLowerCase().trim(), sd);
      }
    }

    const staticDrills: UnifiedDrill[] = drillsData.map((d) => {
      // Try to match with Supabase row by title
      const sbDrill = supabaseByTitle.get(d.name.toLowerCase().trim());

      return {
        id: String(d.id),
        name: d.name,
        difficulty: d.difficulty,
        categories: d.categories,
        duration: d.duration,
        url: d.url,
        is_direct_link: d.is_direct_link,
        isCustom: false,
        ageLevel: d.ageLevel,
        tags: d.tags,
        problem: d.problem,
        goal: d.goal,
        drillType: d.drillType,
        // Enrichment from Supabase
        instructions: sbDrill?.instructions ?? null,
        equipment: sbDrill?.equipment ?? null,
        supabaseId: sbDrill?.id ?? undefined,
      };
    });

    const customDrillsFormatted: UnifiedDrill[] = customDrills.map((cd: any) => ({
      id: cd.drillId,
      name: cd.name,
      difficulty: cd.difficulty,
      categories: [cd.category],
      duration: cd.duration,
      url: `/drill/${cd.drillId}`,
      is_direct_link: true,
      isCustom: true,
      ageLevel: [],
      tags: [],
      problem: [],
      goal: [],
      drillType: cd.drillType || "Game Simulation",
      instructions: null,
      equipment: null,
    }));

    // Merge and sort alphabetically by name (case-insensitive)
    return [...staticDrills, ...customDrillsFormatted].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [customDrills, supabaseDrills]);
}
