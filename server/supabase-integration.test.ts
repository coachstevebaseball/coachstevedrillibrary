import { describe, it, expect } from 'vitest';

describe('Supabase Integration', () => {
  describe('Environment Variables', () => {
    it('should have NEXT_PUBLIC_SUPABASE_URL configured', () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      expect(url).toBeDefined();
      expect(url?.length).toBeGreaterThan(0);
      expect(url).toMatch(/^https:\/\//);
      expect(url).toContain('supabase');
    });

    it('should have NEXT_PUBLIC_SUPABASE_ANON_KEY configured', () => {
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      expect(key).toBeDefined();
      expect(key?.length).toBeGreaterThan(0);
      // Supabase anon keys are JWTs starting with eyJ
      expect(key).toMatch(/^eyJ/);
    });
  });

  describe('Supabase Connection', () => {
    it('should connect to Supabase and query drills table', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      const supabase = createClient(url, key);
      const { data, error } = await supabase
        .from('drills')
        .select('id,title')
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should have seeded drills in the table', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      const supabase = createClient(url, key);
      const { count, error } = await supabase
        .from('drills')
        .select('*', { count: 'exact', head: true });

      expect(error).toBeNull();
      expect(count).toBeGreaterThanOrEqual(100); // We seeded 182 drills
    });

    it('should be able to read drillStatCards table', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      const supabase = createClient(url, key);
      const { data, error } = await supabase
        .from('drillStatCards')
        .select('*')
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should be able to update drill instructions', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      const supabase = createClient(url, key);
      
      // Get a drill to update
      const { data: drills } = await supabase
        .from('drills')
        .select('id,title,instructions')
        .limit(1)
        .single();

      expect(drills).toBeDefined();

      // Update instructions
      const testInstructions = `Test instructions ${Date.now()}`;
      const { error: updateError } = await supabase
        .from('drills')
        .update({ instructions: testInstructions })
        .eq('id', drills!.id);

      expect(updateError).toBeNull();

      // Verify update
      const { data: updated } = await supabase
        .from('drills')
        .select('instructions')
        .eq('id', drills!.id)
        .single();

      expect(updated?.instructions).toBe(testInstructions);

      // Clean up — restore original value
      await supabase
        .from('drills')
        .update({ instructions: drills!.instructions })
        .eq('id', drills!.id);
    });
  });

  describe('Drills Table Schema', () => {
    it('should have expected columns in drills table', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      const supabase = createClient(url, key);
      const { data, error } = await supabase
        .from('drills')
        .select('id,title,video_url,difficulty_level,skill_category,duration_minutes,goal_of_drill,instructions,equipment,created_at')
        .limit(1)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('instructions');
      expect(data).toHaveProperty('equipment');
    });
  });
});
