import { describe, it, expect } from 'vitest';

// We replicate the pure utility functions here to test them without React/wouter dependencies.
// These must match the logic in client/src/hooks/useDrillListParams.ts exactly.

interface DrillListParams {
  page: number;
  category: string;
  difficulty: string;
  search: string;
  sort: string;
  ageLevel: string;
  drillType: string;
  problem: string;
  goal: string;
  tag: string;
}

const DEFAULTS: DrillListParams = {
  page: 1,
  category: 'All',
  difficulty: 'All',
  search: '',
  sort: 'alpha',
  ageLevel: 'all-levels',
  drillType: 'all-types',
  problem: 'all-problems',
  goal: 'all-goals',
  tag: 'all-tags',
};

function parseDrillParams(searchString: string): DrillListParams {
  const cleaned = searchString.startsWith('?') ? searchString.slice(1) : searchString;
  const params = new URLSearchParams(cleaned);
  return {
    page: Math.max(1, parseInt(params.get('page') || '1', 10) || 1),
    category: params.get('category') || DEFAULTS.category,
    difficulty: params.get('difficulty') || DEFAULTS.difficulty,
    search: params.get('search') || DEFAULTS.search,
    sort: params.get('sort') || DEFAULTS.sort,
    ageLevel: params.get('ageLevel') || DEFAULTS.ageLevel,
    drillType: params.get('drillType') || DEFAULTS.drillType,
    problem: params.get('problem') || DEFAULTS.problem,
    goal: params.get('goal') || DEFAULTS.goal,
    tag: params.get('tag') || DEFAULTS.tag,
  };
}

function buildDrillQuery(p: DrillListParams): string {
  const params = new URLSearchParams();
  if (p.page > 1) params.set('page', String(p.page));
  if (p.category !== DEFAULTS.category) params.set('category', p.category);
  if (p.difficulty !== DEFAULTS.difficulty) params.set('difficulty', p.difficulty);
  if (p.search) params.set('search', p.search);
  if (p.sort !== DEFAULTS.sort) params.set('sort', p.sort);
  if (p.ageLevel !== DEFAULTS.ageLevel) params.set('ageLevel', p.ageLevel);
  if (p.drillType !== DEFAULTS.drillType) params.set('drillType', p.drillType);
  if (p.problem !== DEFAULTS.problem) params.set('problem', p.problem);
  if (p.goal !== DEFAULTS.goal) params.set('goal', p.goal);
  if (p.tag !== DEFAULTS.tag) params.set('tag', p.tag);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

describe('parseDrillParams', () => {
  it('returns defaults for empty string', () => {
    const result = parseDrillParams('');
    expect(result).toEqual(DEFAULTS);
  });

  it('returns defaults for just "?"', () => {
    const result = parseDrillParams('?');
    expect(result).toEqual(DEFAULTS);
  });

  it('parses page number', () => {
    const result = parseDrillParams('?page=4');
    expect(result.page).toBe(4);
    expect(result.category).toBe('All');
  });

  it('parses category filter', () => {
    const result = parseDrillParams('?category=Hitting');
    expect(result.category).toBe('Hitting');
    expect(result.page).toBe(1);
  });

  it('parses difficulty filter', () => {
    const result = parseDrillParams('?difficulty=Hard');
    expect(result.difficulty).toBe('Hard');
  });

  it('parses search query', () => {
    const result = parseDrillParams('?search=tee');
    expect(result.search).toBe('tee');
  });

  it('parses sort order', () => {
    const result = parseDrillParams('?sort=newest');
    expect(result.sort).toBe('newest');
  });

  it('parses ageLevel filter', () => {
    const result = parseDrillParams('?ageLevel=advanced-drills');
    expect(result.ageLevel).toBe('advanced-drills');
  });

  it('parses drillType filter', () => {
    const result = parseDrillParams('?drillType=Front+Toss');
    expect(result.drillType).toBe('Front Toss');
  });

  it('parses problem filter', () => {
    const result = parseDrillParams('?problem=lunging');
    expect(result.problem).toBe('lunging');
  });

  it('parses goal filter', () => {
    const result = parseDrillParams('?goal=power');
    expect(result.goal).toBe('power');
  });

  it('parses tag filter', () => {
    const result = parseDrillParams('?tag=bat+speed');
    expect(result.tag).toBe('bat speed');
  });

  it('parses all 7 dimensions combined', () => {
    const result = parseDrillParams(
      '?page=2&category=Hitting&difficulty=Hard&search=tee&sort=newest&ageLevel=beginner-drills&drillType=Tee+Work&problem=casting&goal=swing-mechanics&tag=foundation'
    );
    expect(result.page).toBe(2);
    expect(result.category).toBe('Hitting');
    expect(result.difficulty).toBe('Hard');
    expect(result.search).toBe('tee');
    expect(result.sort).toBe('newest');
    expect(result.ageLevel).toBe('beginner-drills');
    expect(result.drillType).toBe('Tee Work');
    expect(result.problem).toBe('casting');
    expect(result.goal).toBe('swing-mechanics');
    expect(result.tag).toBe('foundation');
  });

  it('handles string without ? prefix', () => {
    const result = parseDrillParams('page=3&category=Pitching&ageLevel=pro-level-drills');
    expect(result.page).toBe(3);
    expect(result.category).toBe('Pitching');
    expect(result.ageLevel).toBe('pro-level-drills');
  });

  it('clamps invalid page to 1', () => {
    expect(parseDrillParams('?page=0').page).toBe(1);
    expect(parseDrillParams('?page=-5').page).toBe(1);
    expect(parseDrillParams('?page=abc').page).toBe(1);
  });

  it('handles URL-encoded search terms', () => {
    const result = parseDrillParams('?search=1-2-3%20drill');
    expect(result.search).toBe('1-2-3 drill');
  });

  it('returns defaults for new dimensions when only old params present', () => {
    const result = parseDrillParams('?difficulty=Easy&category=Hitting');
    expect(result.ageLevel).toBe('all-levels');
    expect(result.drillType).toBe('all-types');
    expect(result.problem).toBe('all-problems');
    expect(result.goal).toBe('all-goals');
    expect(result.tag).toBe('all-tags');
  });
});

describe('buildDrillQuery', () => {
  it('returns empty string for all defaults', () => {
    expect(buildDrillQuery(DEFAULTS)).toBe('');
  });

  it('includes page when > 1', () => {
    const query = buildDrillQuery({ ...DEFAULTS, page: 4 });
    expect(query).toBe('?page=4');
  });

  it('omits page when 1', () => {
    const query = buildDrillQuery({ ...DEFAULTS, page: 1 });
    expect(query).toBe('');
  });

  it('includes category when not All', () => {
    const query = buildDrillQuery({ ...DEFAULTS, category: 'Hitting' });
    expect(query).toBe('?category=Hitting');
  });

  it('includes difficulty when not All', () => {
    const query = buildDrillQuery({ ...DEFAULTS, difficulty: 'Hard' });
    expect(query).toBe('?difficulty=Hard');
  });

  it('includes search when non-empty', () => {
    const query = buildDrillQuery({ ...DEFAULTS, search: 'tee' });
    expect(query).toBe('?search=tee');
  });

  it('includes sort when not alpha', () => {
    const query = buildDrillQuery({ ...DEFAULTS, sort: 'newest' });
    expect(query).toBe('?sort=newest');
  });

  it('includes ageLevel when not default', () => {
    const query = buildDrillQuery({ ...DEFAULTS, ageLevel: 'advanced-drills' });
    expect(query).toBe('?ageLevel=advanced-drills');
  });

  it('includes drillType when not default', () => {
    const query = buildDrillQuery({ ...DEFAULTS, drillType: 'Front Toss' });
    expect(query).toContain('drillType=Front+Toss');
  });

  it('includes problem when not default', () => {
    const query = buildDrillQuery({ ...DEFAULTS, problem: 'lunging' });
    expect(query).toBe('?problem=lunging');
  });

  it('includes goal when not default', () => {
    const query = buildDrillQuery({ ...DEFAULTS, goal: 'power' });
    expect(query).toBe('?goal=power');
  });

  it('includes tag when not default', () => {
    const query = buildDrillQuery({ ...DEFAULTS, tag: 'bat speed' });
    expect(query).toContain('tag=bat+speed');
  });

  it('combines multiple params including new dimensions', () => {
    const query = buildDrillQuery({
      page: 2,
      category: 'Hitting',
      difficulty: 'All',
      search: 'tee',
      sort: 'newest',
      ageLevel: 'beginner-drills',
      drillType: 'all-types',
      problem: 'all-problems',
      goal: 'power',
      tag: 'all-tags',
    });
    expect(query).toContain('page=2');
    expect(query).toContain('category=Hitting');
    expect(query).toContain('search=tee');
    expect(query).toContain('sort=newest');
    expect(query).toContain('ageLevel=beginner-drills');
    expect(query).toContain('goal=power');
    expect(query).not.toContain('difficulty');
    expect(query).not.toContain('drillType');
    expect(query).not.toContain('problem');
    expect(query).not.toContain('tag');
    expect(query.startsWith('?')).toBe(true);
  });

  it('roundtrips with parseDrillParams for all dimensions', () => {
    const original: DrillListParams = {
      page: 3,
      category: 'Bunting',
      difficulty: 'Medium',
      search: 'flip',
      sort: 'newest',
      ageLevel: 'intermediate-drills',
      drillType: 'Soft Toss',
      problem: 'casting',
      goal: 'swing-mechanics',
      tag: 'foundation',
    };
    const query = buildDrillQuery(original);
    const parsed = parseDrillParams(query);
    expect(parsed).toEqual(original);
  });

  it('roundtrips defaults correctly', () => {
    const query = buildDrillQuery(DEFAULTS);
    const parsed = parseDrillParams(query);
    expect(parsed).toEqual(DEFAULTS);
  });
});
