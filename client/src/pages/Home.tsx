import { useAuth } from "@/_core/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Sheet import removed — advanced filters are always visible inline
import {
  Search, Users, ChevronRight, Sparkles,
  Clock, Target, TrendingUp, SlidersHorizontal, X, Pencil, ChevronDown,
} from "lucide-react";
import { HomePageSkeleton } from "@/components/Skeleton";
import { Link } from "wouter";
import { useState, useMemo, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAllDrills } from "@/hooks/useAllDrills";
import { DrillEditModal } from "@/components/DrillEditModal";
import { useDrillListParams } from "@/hooks/useDrillListParams";
import { TopNav } from "@/components/TopNav";
import { InlineEdit } from "@/components/InlineEdit";
import { filterOptions, drillTypeOptions } from "@/data/drills";

interface Drill {
  id: string;
  name: string;
  difficulty: string;
  categories: string[];
  duration: string;
  url?: string;
  is_direct_link?: boolean;
  isCustom?: boolean;
}

// Difficulty config
const DIFFICULTY_CONFIG: Record<string, { label: string; class: string; dotClass: string }> = {
  Easy: { label: "Easy", class: "badge-easy", dotClass: "bg-emerald-400" },
  Medium: { label: "Medium", class: "badge-medium", dotClass: "bg-amber-400" },
  Hard: { label: "Hard", class: "badge-hard", dotClass: "bg-rose-400" },
};

// Category config
// Only Hitting drills are active for now. Other categories are archived and can be restored later.
const CATEGORIES = ["All", "Hitting"];

/**
 * Save scroll position to sessionStorage keyed by the current query string.
 */
function saveScrollPosition(queryKey: string) {
  sessionStorage.setItem(`drill-scroll-${queryKey}`, String(window.scrollY));
}

/**
 * Restore scroll position from sessionStorage for the given query key.
 */
function restoreScrollPosition(queryKey: string) {
  const saved = sessionStorage.getItem(`drill-scroll-${queryKey}`);
  if (saved) {
    window.scrollTo(0, parseInt(saved, 10));
  }
}

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  // URL-synced filter/pagination state (all 7 dimensions)
  const {
    page: currentPage,
    category: categoryFilter,
    difficulty: difficultyFilter,
    search: searchQuery,
    sort,
    ageLevel: ageLevelFilter,
    drillType: drillTypeFilter,
    problem: problemFilter,
    goal: goalFilter,
    tag: tagFilter,
    setPage: setCurrentPage,
    setCategory: setCategoryFilter,
    setDifficulty: setDifficultyFilter,
    setSearch: setSearchQuery,
    setSort,
    setAgeLevel: setAgeLevelFilter,
    setDrillType: setDrillTypeFilter,
    setProblem: setProblemFilter,
    setGoal: setGoalFilter,
    setTag: setTagFilter,
    resetAll,
    currentQuery,
    activeFilterCount,
    hasActiveFilters,
  } = useDrillListParams();

  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const DRILLS_PER_PAGE = 21;
  const hasRestoredScroll = useRef(false);

  // Accordion open/close state for the 3 visible filter sections
  const [problemOpen, setProblemOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);

  // Multi-select state for accordion filters (arrays of selected values)
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Mobile "More Filters" sheet state
  // moreFiltersOpen removed — advanced filters are always visible

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDrill, setEditingDrill] = useState<Drill | null>(null);

  // Fetch drill customizations
  const { data: drillCustomizations = [], refetch: refetchCustomizations } = trpc.drillCustomizations.getAll.useQuery();

  const customizationsMap = useMemo(() => {
    const map = new Map<string, typeof drillCustomizations[0]>();
    drillCustomizations.forEach((c) => map.set(c.drillId, c));
    return map;
  }, [drillCustomizations]);

  // Set SEO-friendly document title
  useEffect(() => {
    document.title = "Baseball Training Drills | Coach Steve's Library";
  }, []);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Merge static + custom drills, sorted alphabetically
  const allDrills = useAllDrills();

  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    allDrills.forEach(drill => drill.categories.forEach(cat => categories.add(cat)));
    return ["All", ...Array.from(categories).sort()];
  }, [allDrills]);

  // Full 7-dimension filtering
  const filteredDrills = useMemo(() => {
    return allDrills.filter(drill => {
      const matchesSearch = drill.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = difficultyFilter === "All" || drill.difficulty === difficultyFilter;
      const matchesCategory = categoryFilter === "All" || drill.categories.includes(categoryFilter);
      const matchesAgeLevel = ageLevelFilter === "all-levels" || (drill.ageLevel ?? []).includes(ageLevelFilter);
      const matchesDrillType = drillTypeFilter === "all-types" || drill.drillType === drillTypeFilter;
      // Multi-select: match if no selections OR drill has at least one selected value
      // Also checks the richer problems[]/outcomes[] arrays (canonical display labels) in addition to legacy problem/goal slug arrays
      const matchesProblem = selectedProblems.length === 0 || selectedProblems.some(p =>
        (drill.problem ?? []).includes(p) || (drill.problems ?? []).includes(p)
      );
      const matchesGoal = selectedGoals.length === 0 || selectedGoals.some(g =>
        (drill.goal ?? []).includes(g) || (drill.outcomes ?? []).includes(g)
      );
      const matchesTag = selectedTags.length === 0 || selectedTags.some(t => (drill.tags ?? []).includes(t));
      return matchesSearch && matchesDifficulty && matchesCategory && matchesAgeLevel && matchesDrillType && matchesProblem && matchesGoal && matchesTag;
    });
  }, [allDrills, searchQuery, difficultyFilter, categoryFilter, ageLevelFilter, drillTypeFilter, selectedProblems, selectedGoals, selectedTags]);

  const totalPages = Math.ceil(filteredDrills.length / DRILLS_PER_PAGE);
  const startIndex = (currentPage - 1) * DRILLS_PER_PAGE;
  const paginatedDrills = filteredDrills.slice(startIndex, startIndex + DRILLS_PER_PAGE);

  // Restore scroll position after drills render (on back navigation)
  useEffect(() => {
    if (hasRestoredScroll.current) return;
    if (paginatedDrills.length === 0) return;
    hasRestoredScroll.current = true;
    const timer = setTimeout(() => {
      restoreScrollPosition(currentQuery || '__default__');
    }, 80);
    return () => clearTimeout(timer);
  }, [paginatedDrills.length, currentQuery]);

  // Count advanced filters
  const advancedFilterCount = [
    ageLevelFilter !== "all-levels",
    drillTypeFilter !== "all-types",
    ...selectedProblems,
    ...selectedGoals,
    ...selectedTags,
  ].filter(Boolean).length;

  if (loading) return <HomePageSkeleton />;

  /** Handle drill card click: save scroll position, then navigate */
  const handleDrillClick = (drillId: string) => {
    saveScrollPosition(currentQuery || '__default__');
  };

  /** Helper: toggle a value in a multi-select array */
  const toggleMultiSelect = (arr: string[], val: string, setArr: (v: string[]) => void) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  /** Accordion filter card used for Fix a Problem / Build a Skill / Focus Areas */
  const AccordionFilterCard = ({
    label, subtitle, options, selected, onToggle, isOpen, onToggleOpen,
  }: {
    label: string;
    subtitle: string;
    options: { value: string; label: string }[];
    selected: string[];
    onToggle: (v: string) => void;
    isOpen: boolean;
    onToggleOpen: () => void;
  }) => (
    <div className="rounded-xl border border-white/8 bg-[#0A1628] overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={onToggleOpen}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left group"
      >
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-widest text-[#e4002b]">
            {label}
            {selected.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#e4002b] text-white text-[9px] font-bold">
                {selected.length}
              </span>
            )}
          </span>
          <span className="block text-[11px] text-muted-foreground mt-0.5">{subtitle}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expandable checkbox grid */}
      {isOpen && (
        <div className="px-4 pb-4 border-t border-white/8">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-3">
            {options.map(opt => {
              const checked = selected.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 cursor-pointer group/cb"
                >
                  <span
                    className={`flex-shrink-0 w-4 h-4 rounded border transition-all duration-150 flex items-center justify-center ${
                      checked
                        ? "bg-[#e4002b] border-[#e4002b]"
                        : "border-white/20 bg-white/5 group-hover/cb:border-[#e4002b]/50"
                    }`}
                    onClick={() => onToggle(opt.value)}
                  >
                    {checked && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span
                    className={`text-[11px] leading-tight transition-colors ${
                      checked ? "text-foreground font-medium" : "text-muted-foreground group-hover/cb:text-foreground"
                    }`}
                    onClick={() => onToggle(opt.value)}
                  >
                    {opt.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  /** Render the advanced filter panel */
  const renderAdvancedFilters = (_inSheet = false) => (
    <div className="space-y-3">
      {/* AGE / LEVEL — hidden but kept in code for future re-enable */}
      {/* FEATURE FLAG: set to true to re-enable Age/Level filter */}
      {false && (
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Age / Level</label>
          <Select value={ageLevelFilter} onValueChange={setAgeLevelFilter}>
            <SelectTrigger className="w-full text-sm bg-card/80 border-border/50">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-levels">All Levels</SelectItem>
              {filterOptions.ageLevel.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* DRILL TYPE — hidden but kept in code for future re-enable */}
      {/* FEATURE FLAG: set to true to re-enable Drill Type filter */}
      {false && (
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">Drill Type</label>
          <Select value={drillTypeFilter} onValueChange={setDrillTypeFilter}>
            <SelectTrigger className="w-full text-sm bg-card/80 border-border/50">
              <SelectValue placeholder="All Drill Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-types">All Drill Types</SelectItem>
              {drillTypeOptions.map(group => (
                <div key={group.label}>
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</div>
                  {group.options.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* FIX A PROBLEM */}
      <AccordionFilterCard
        label="Fix a Problem"
        subtitle="What are you trying to fix?"
        options={filterOptions.problem}
        selected={selectedProblems}
        onToggle={(v) => toggleMultiSelect(selectedProblems, v, setSelectedProblems)}
        isOpen={problemOpen}
        onToggleOpen={() => setProblemOpen(o => !o)}
      />

      {/* BUILD A SKILL (was: Training Goal) */}
      <AccordionFilterCard
        label="Build a Skill"
        subtitle="What are you building?"
        options={filterOptions.goal}
        selected={selectedGoals}
        onToggle={(v) => toggleMultiSelect(selectedGoals, v, setSelectedGoals)}
        isOpen={goalOpen}
        onToggleOpen={() => setGoalOpen(o => !o)}
      />

      {/* FOCUS AREAS (was: Tag / Focus Area) */}
      <AccordionFilterCard
        label="Focus Areas"
        subtitle="Pick a focus area"
        options={filterOptions.tags.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
        selected={selectedTags}
        onToggle={(v) => toggleMultiSelect(selectedTags, v, setSelectedTags)}
        isOpen={tagOpen}
        onToggleOpen={() => setTagOpen(o => !o)}
      />
    </div>
  );

  /** Build active filter pills */
  const hasAnyActiveFilters = hasActiveFilters || selectedProblems.length > 0 || selectedGoals.length > 0 || selectedTags.length > 0;

  const handleClearAll = () => {
    resetAll();
    setSelectedProblems([]);
    setSelectedGoals([]);
    setSelectedTags([]);
  };

  const renderFilterPills = () => {
    if (!hasAnyActiveFilters) return null;

    const pills: { label: string; onRemove: () => void; variant?: 'crimson' | 'default' }[] = [];

    if (searchQuery) {
      pills.push({ label: `Search: "${searchQuery}"`, onRemove: () => setSearchQuery("") });
    }
    if (difficultyFilter !== "All") {
      pills.push({ label: difficultyFilter, onRemove: () => setDifficultyFilter("All") });
    }
    if (categoryFilter !== "All") {
      pills.push({ label: categoryFilter, onRemove: () => setCategoryFilter("All") });
    }
    if (ageLevelFilter !== "all-levels") {
      const opt = filterOptions.ageLevel.find(o => o.value === ageLevelFilter);
      pills.push({ label: opt?.label || ageLevelFilter, onRemove: () => setAgeLevelFilter("all-levels") });
    }
    if (drillTypeFilter !== "all-types") {
      pills.push({ label: `Type: ${drillTypeFilter}`, onRemove: () => setDrillTypeFilter("all-types") });
    }
    // Multi-select: Fix a Problem
    selectedProblems.forEach(val => {
      const opt = filterOptions.problem.find(o => o.value === val);
      pills.push({
        label: `Fix: ${opt?.label || val}`,
        onRemove: () => setSelectedProblems(prev => prev.filter(x => x !== val)),
        variant: 'crimson',
      });
    });
    // Multi-select: Build a Skill
    selectedGoals.forEach(val => {
      const opt = filterOptions.goal.find(o => o.value === val);
      pills.push({
        label: `Skill: ${opt?.label || val}`,
        onRemove: () => setSelectedGoals(prev => prev.filter(x => x !== val)),
        variant: 'crimson',
      });
    });
    // Multi-select: Focus Areas
    selectedTags.forEach(val => {
      pills.push({
        label: `Focus: ${val.charAt(0).toUpperCase() + val.slice(1)}`,
        onRemove: () => setSelectedTags(prev => prev.filter(x => x !== val)),
        variant: 'crimson',
      });
    });

    return (
      <div className="flex flex-wrap items-center gap-2 mb-6 animate-fade-in-up">
        {pills.map((pill, i) => (
          <button
            key={i}
            onClick={pill.onRemove}
            className={
              pill.variant === 'crimson'
                ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#e4002b]/15 text-[#e4002b] border border-[#e4002b]/30 hover:bg-[#e4002b]/25 hover:border-[#e4002b]/50 transition-all duration-300 group"
                : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-electric/10 text-electric border border-electric/20 hover:bg-electric/20 hover:border-electric/40 transition-all duration-300 group"
            }
          >
            {pill.label}
            <X className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
        <button
          onClick={handleClearAll}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-300"
        >
          Clear all
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ===== HERO SECTION ===== */}
      <header ref={heroRef} className="relative overflow-hidden">
        {/* Layered background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 gradient-hero" />
          <div className="absolute inset-0 gradient-mesh opacity-60" />
          <div className="absolute inset-0 gradient-glow" />
        </div>
        
        {/* Floating ambient orbs */}
        <div 
          className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-electric/8 rounded-full blur-[100px] animate-float"
          style={{ transform: `translateY(${scrollY * -0.08}px)` }}
        />
        <div 
          className="absolute top-40 -left-20 w-[300px] h-[300px] bg-secondary/6 rounded-full blur-[80px] animate-float"
          style={{ animationDelay: '2s', transform: `translateY(${scrollY * -0.12}px)` }}
        />
        <div 
          className="absolute bottom-0 right-1/3 w-[250px] h-[250px] bg-electric/5 rounded-full blur-[60px] animate-float"
          style={{ animationDelay: '3.5s' }}
        />
        
        <div className="container relative z-10 pt-4 pb-6 md:pt-5 md:pb-8">
          {/* Top Navigation Bar */}
          <TopNav variant="hero" />

          {/* Hero Content */}
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="flex justify-center mb-3 animate-fade-in-down stagger-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-electric/20 bg-electric/5 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-electric animate-pulse-glow" />
                <InlineEdit contentKey="home.hero.badge" defaultValue="Player Development Platform" as="span" className="text-electric text-[10px] font-semibold tracking-wider uppercase" />
              </div>
            </div>
            
            {/* Main heading */}
            <div className="animate-fade-in-up stagger-2">
              <h1 className="font-heading font-black tracking-tight leading-none">
                <InlineEdit contentKey="home.hero.headline1" defaultValue="UNLEASH YOUR" as="span" className="block text-foreground text-3xl sm:text-4xl md:text-5xl" />
                <InlineEdit contentKey="home.hero.headline2" defaultValue="POTENTIAL" as="span" className="block text-4xl sm:text-5xl md:text-6xl mt-0.5 text-gradient" />
              </h1>
            </div>
            
            <InlineEdit contentKey="home.hero.tagline" defaultValue="Professional training drills designed to build elite mechanics, explosive power, and game-ready confidence." as="h2" className="text-xs md:text-sm text-muted-foreground mt-3 mb-4 max-w-xl mx-auto leading-relaxed animate-fade-in-up stagger-3 font-normal" />
            
            {/* Stats row */}
            <div className="flex justify-center gap-6 md:gap-12 animate-fade-in-up stagger-4">
              {[
                { valueKey: "home.stat.drills.value", valueDefault: `${allDrills.length}+`, labelKey: "home.stat.drills.label", labelDefault: "Drills", icon: Target },
                { valueKey: "home.stat.categories.value", valueDefault: "1", labelKey: "home.stat.categories.label", labelDefault: "Focus: Hitting", icon: Sparkles },
                { valueKey: "home.stat.levels.value", valueDefault: "3", labelKey: "home.stat.levels.label", labelDefault: "Levels", icon: TrendingUp },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <stat.icon className="h-3 w-3 text-electric" />
                    <InlineEdit contentKey={stat.valueKey} defaultValue={stat.valueDefault} as="span" className="text-lg md:text-xl font-heading font-bold text-foreground" />
                  </div>
                  <InlineEdit contentKey={stat.labelKey} defaultValue={stat.labelDefault} as="span" className="text-[10px] text-muted-foreground uppercase tracking-wider" />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 container py-6 md:py-10">
        {/* Search + Filters Section */}
        <div className="max-w-5xl mx-auto mb-8">
          {/* Search Bar */}
          <div className="mb-6 animate-fade-in-up">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-electric transition-colors duration-300" />
              </div>
              <Input
                type="text"
                placeholder="Search drills..."
                className="pl-12 py-6 text-base bg-card/80 text-foreground border-border/50 rounded-xl focus-visible:ring-2 focus-visible:ring-electric/50 focus-visible:border-electric/30 font-medium transition-all duration-300 hover:border-electric/20 placeholder:text-muted-foreground/60"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Primary Filters: Level + Skill (always visible) */}
          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {/* Difficulty */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">Level</span>
              {["All", "Easy", "Medium", "Hard"].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficultyFilter(level)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                    difficultyFilter === level
                      ? level === "Easy" ? "badge-easy"
                        : level === "Medium" ? "badge-medium"
                        : level === "Hard" ? "badge-hard"
                        : "bg-electric text-white shadow-lg shadow-electric/25"
                      : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground border border-border/50"
                  }`}
                >
                  {level === "All" ? "All Levels" : level}
                </button>
              ))}
            </div>

            {/* Category */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">Skill</span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                    categoryFilter === cat
                      ? "bg-electric text-white shadow-lg shadow-electric/25"
                      : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground border border-border/50"
                  }`}
                >
                  {cat === "All" ? "All Skills" : cat}
                </button>
              ))}
            </div>

            {/* Advanced Filters — always visible on all screen sizes */}
            <div className="pt-1">
              <div className="flex items-center gap-2 mb-3">
                <SlidersHorizontal className="h-3.5 w-3.5 text-electric" />
                <span className="text-xs font-semibold text-electric uppercase tracking-wider">Narrow By Problem, Goal &amp; More</span>
              </div>
              {renderAdvancedFilters(false)}
            </div>
          </div>
        </div>

        {/* Active Filter Pills */}
        <div className="max-w-5xl mx-auto">
          {renderFilterPills()}
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6 max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center gap-3">
            <InlineEdit contentKey="home.section.trainingLibrary" defaultValue="Training Library" as="h2" className="text-xl font-heading font-bold text-foreground" />
            <span className="text-xs font-semibold text-electric bg-electric/10 px-2.5 py-1 rounded-full">
              {filteredDrills.length} drills
            </span>
          </div>
        </div>

        {/* ===== DRILL CARDS GRID ===== */}
        {paginatedDrills.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {paginatedDrills.map((drill, index) => {
              const customization = customizationsMap.get(drill.id);
              const displayDifficulty = customization?.difficulty || drill.difficulty;
              const displayCategory = customization?.category || drill.categories[0] || "General";
              const displayDescription = customization?.briefDescription || `Master this drill to improve your ${drill.categories[0]?.toLowerCase() || "baseball"} skills.`;
              const imageSource = customization?.thumbnailUrl 
                || (customization?.imageBase64 && customization?.imageMimeType
                  ? `data:${customization.imageMimeType};base64,${customization.imageBase64}`
                  : null);
              const diffConfig = DIFFICULTY_CONFIG[displayDifficulty] || DIFFICULTY_CONFIG.Easy;

              // Build drill detail URL preserving current query params
              const drillDetailHref = `/drill/${drill.id}${currentQuery}`;

              return (
                <div 
                  key={drill.id}
                  className="group animate-fade-in-up relative"
                  style={{ animationDelay: `${Math.min(index * 0.04, 0.4)}s` }}
                >
                  {/* Admin Edit Button */}
                  {user?.role === 'admin' && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingDrill(drill);
                        setEditModalOpen(true);
                      }}
                      className="absolute top-3 left-3 z-20 p-2 rounded-lg bg-black/60 hover:bg-electric/80 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 hover:scale-105 shadow-lg backdrop-blur-sm"
                      title="Edit drill card"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <Link
                    href={drillDetailHref}
                    className="block h-full"
                    onClick={() => handleDrillClick(drill.id)}
                  >
                    <div className="glass-card rounded-xl overflow-hidden drill-card-hover cursor-pointer h-full flex flex-col">
                      {/* Card Image */}
                      <div className="relative h-44 bg-gradient-to-br from-card to-accent overflow-hidden">
                        {imageSource ? (
                          <img 
                            src={imageSource}
                            alt={drill.name}
                            className="w-full h-full object-cover opacity-90 group-hover:scale-108 transition-transform duration-700 ease-out"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <img 
                            src={`/images/drills/${drill.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`}
                            alt={drill.name}
                            className="w-full h-full object-cover opacity-75 group-hover:scale-108 transition-transform duration-700 ease-out"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        
                        {/* Gradient overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-br from-electric/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        {/* Difficulty Badge */}
                        <div className="absolute top-3 right-3">
                          <InlineEdit contentKey={`drill.card.${drill.id}.difficulty`} defaultValue={displayDifficulty} as="span" className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${diffConfig.class}`} />
                        </div>
                        
                        {/* Duration badge */}
                        {drill.duration && drill.duration !== "Unknown" && (
                          <div className="absolute bottom-3 right-3">
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/50 text-white/80 backdrop-blur-sm">
                              <Clock className="h-2.5 w-2.5" />
                              <InlineEdit contentKey={`drill.card.${drill.id}.duration`} defaultValue={drill.duration} as="span" />
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Card Body */}
                      <div className="p-4 flex-1 flex flex-col">
                        {/* Category */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${diffConfig.dotClass}`} />
                          <InlineEdit contentKey={`drill.card.${drill.id}.category`} defaultValue={displayCategory} as="span" className="text-electric text-[10px] font-bold uppercase tracking-wider" />
                        </div>
                        
                        {/* Title */}
                        <InlineEdit contentKey={`drill.card.${drill.id}.title`} defaultValue={drill.name} as="h3" className="text-base font-heading font-bold text-foreground mb-2 group-hover:text-electric transition-colors duration-300 leading-tight" />
                        
                        {/* Description */}
                        <InlineEdit contentKey={`drill.card.${drill.id}.description`} defaultValue={displayDescription} as="p" className="text-xs text-muted-foreground mb-3 flex-1 line-clamp-2 leading-relaxed" />
                        
                        {/* Footer */}
                        <div className="flex items-center text-muted-foreground group-hover:text-electric transition-all duration-300 pt-2 border-t border-border/30">
                          <InlineEdit contentKey="home.card.viewDetails" defaultValue="View Details" as="span" className="text-xs font-semibold" />
                          <ChevronRight className="h-3.5 w-3.5 ml-auto group-hover:translate-x-1 transition-transform duration-300" />  
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 glass-card rounded-2xl border-dashed border border-border/30 max-w-md mx-auto">
            <div className="bg-muted/30 h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-heading font-bold mb-2">No drills found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              No drills match your current filters. Try adjusting your search or filters.
            </p>
            <Button 
              onClick={() => handleClearAll()}
              className="btn-premium text-white text-sm">
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-10 animate-fade-in-up">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="glass border-border/50 hover:border-electric/30 hover:bg-electric/5 disabled:opacity-40 transition-all duration-300"
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-300 ${
                      currentPage === page
                        ? "bg-electric text-white shadow-lg shadow-electric/25"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="glass border-border/50 hover:border-electric/30 hover:bg-electric/5 disabled:opacity-40 transition-all duration-300"
            >
              Next
            </Button>
          </div>
        )}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="relative py-8 mt-auto border-t border-border/20">
        <div className="absolute inset-0 bg-gradient-to-t from-card/30 to-transparent" />
        <div className="container relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-br from-primary to-electric rounded-lg flex items-center justify-center font-heading font-bold text-sm text-white">
                CS
              </div>
              <div>
                <InlineEdit contentKey="home.footer.title" defaultValue="USA Baseball Drills Directory" as="h3" className="font-heading font-bold text-sm text-foreground" />
                <InlineEdit contentKey="home.footer.subtitle" defaultValue="Coach Steve Baseball — Player Drill Library" as="p" className="text-xs text-muted-foreground" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-center md:text-right">
              <InlineEdit contentKey="home.footer.source" defaultValue="Data sourced from USA Baseball Mobile Coach." as="p" />
              <p className="mt-0.5">&copy; {new Date().getFullYear()} All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Advanced filters are now always visible inline — sheet removed */}

      {/* Drill Edit Modal */}
      {editingDrill && (
        <DrillEditModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingDrill(null);
          }}
          drill={editingDrill}
          customization={customizationsMap.get(editingDrill.id)}
          onSaved={() => refetchCustomizations()}
        />
      )}
    </div>
  );
}
