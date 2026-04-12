import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

/**
 * Supabase drills table row shape
 * Columns: id, title, video_url, difficulty_level, skill_category,
 *          duration_minutes, goal_of_drill, instructions, equipment, created_at
 */
export interface SupabaseDrill {
  id: number;
  title: string;
  video_url: string | null;
  difficulty_level: string | null;
  skill_category: string | null;
  duration_minutes: number | null;
  goal_of_drill: string | null;
  instructions: string | null;
  equipment: string | null;
  created_at: string;
}

interface UseSupabaseDrillsResult {
  drills: SupabaseDrill[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch all drills from the Supabase drills table.
 * Returns the raw Supabase rows — use alongside the static drills data
 * for enrichment (instructions, equipment, video_url from Supabase;
 * tags, ageLevel, problem, goal, drillType from static).
 */
export function useSupabaseDrills(): UseSupabaseDrillsResult {
  const [drills, setDrills] = useState<SupabaseDrill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchDrills() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('drills')
        .select('*')
        .order('title', { ascending: true });

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setDrills([]);
      } else {
        setDrills(data ?? []);
      }
      setLoading(false);
    }

    fetchDrills();
    return () => { cancelled = true; };
  }, [refetchKey]);

  const refetch = () => setRefetchKey(k => k + 1);

  return { drills, loading, error, refetch };
}

/**
 * Hook to fetch a single drill by its Supabase ID.
 */
export function useSupabaseDrill(id: number | null) {
  const [drill, setDrill] = useState<SupabaseDrill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id === null) {
      setDrill(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchDrill() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('drills')
        .select('*')
        .eq('id', id)
        .single();

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setDrill(null);
      } else {
        setDrill(data);
      }
      setLoading(false);
    }

    fetchDrill();
    return () => { cancelled = true; };
  }, [id]);

  return { drill, loading, error };
}

/**
 * Hook to search drills by title in Supabase.
 */
export function useSupabaseDrillSearch(query: string) {
  const [drills, setDrills] = useState<SupabaseDrill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setDrills([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function search() {
      setLoading(true);
      setError(null);

      const { data, error: searchError } = await supabase
        .from('drills')
        .select('*')
        .ilike('title', `%${query}%`)
        .order('title', { ascending: true })
        .limit(50);

      if (cancelled) return;

      if (searchError) {
        setError(searchError.message);
        setDrills([]);
      } else {
        setDrills(data ?? []);
      }
      setLoading(false);
    }

    // Debounce
    const timer = setTimeout(search, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  return { drills, loading, error };
}
