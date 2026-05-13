import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Search, ChevronRight, ChevronDown, Clock, X, SlidersHorizontal, Star,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAllDrills, useAllDrillsQuery } from "@/hooks/useAllDrills";
import { trpc } from "@/lib/trpc";
import { filterOptions } from "@/data/drillConstants";

// ─── Constants ───────────────────────────────────────────────────────────────
const DRILLS_PER_PAGE = 21;
const CATEGORIES = ["All", "Hitting", "Infield", "Pitching", "Throwing", "Outfield", "Bunting"];
const DIFFICULTY_CONFIG: Record<string, { label: string; class: string; dotClass: string }> = {
  Easy: { label: "Easy", class: "badge-easy", dotClass: "bg-emerald-400" },
  Medium: { label: "Medium", class: "badge-medium", dotClass: "bg-amber-400" },
  Hard: { label: "Hard", class: "badge-hard", dotClass: "bg-rose-400" },
};

// ─── Accordion Filter Card ──────────────────────────────────────────────────
function AccordionFilterCard({
  label, subtitle, options, selected, onToggle, isOpen, onToggleOpen,
}: {
  label: string;
  subtitle: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-[#0A1628] overflow-hidden">
      <button
        type="button"
        onClick={onToggleOpen}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left group min-h-[44px]"
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
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-white/8">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-3">
            {options.map(opt => {
              const checked = selected.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 cursor-pointer group/cb min-h-[44px]"
                >
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded border transition-all duration-150 flex items-center justify-center ${
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
}

// ─── Iframe Height Broadcaster ──────────────────────────────────────────────
function useEmbedHeightBroadcast() {
  useEffect(() => {
    function postHeight() {
      const h = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: "csmc:embed-height", height: h }, "*");
    }

    // Post on mount
    postHeight();

    // ResizeObserver for dynamic content changes
    const ro = new ResizeObserver(() => postHeight());
    ro.observe(document.documentElement);

    // Also post on images loading (they change height)
    const observer = new MutationObserver(() => {
      requestAnimationFrame(postHeight);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      ro.disconnect();
      observer.disconnect();
    };
  }, []);
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function EmbedDrillLibrary() {
  useEmbedHeightBroadcast();

  const allDrills = useAllDrills();
  const { isLoading: drillsLoading } = useAllDrillsQuery();

  // Fetch drill customizations for photo thumbnails
  const { data: drillCustomizations = [] } = trpc.drillCustomizations.getAll.useQuery();
  const customizationsMap = useMemo(() => {
    const map = new Map<string, typeof drillCustomizations[0]>();
    drillCustomizations.forEach((c) => map.set(c.drillId, c));
    return map;
  }, [drillCustomizations]);

  // ── Filter State ──
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Accordion open/close
  const [problemOpen, setProblemOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);

  // Multi-select
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleMultiSelect = (arr: string[], val: string, setArr: (v: string[]) => void) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  // ── Derived Data ──
  const filteredDrills = useMemo(() => {
    return allDrills.filter(drill => {
      const matchesSearch = drill.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = difficultyFilter === "All" || drill.difficulty === difficultyFilter;
      const matchesCategory = categoryFilter === "All" || drill.categories.includes(categoryFilter);
      const matchesProblem = selectedProblems.length === 0 || selectedProblems.some(p =>
        (drill.problem ?? []).includes(p) || (drill.problems ?? []).includes(p)
      );
      const matchesGoal = selectedGoals.length === 0 || selectedGoals.some(g =>
        (drill.goal ?? []).includes(g) || (drill.outcomes ?? []).includes(g)
      );
      const matchesTag = selectedTags.length === 0 || selectedTags.some(t => (drill.tags ?? []).includes(t));
      return matchesSearch && matchesDifficulty && matchesCategory && matchesProblem && matchesGoal && matchesTag;
    });
  }, [allDrills, searchQuery, difficultyFilter, categoryFilter, selectedProblems, selectedGoals, selectedTags]);

  const totalPages = Math.ceil(filteredDrills.length / DRILLS_PER_PAGE);
  const paginatedDrills = useMemo(() => {
    const start = (currentPage - 1) * DRILLS_PER_PAGE;
    return filteredDrills.slice(start, start + DRILLS_PER_PAGE);
  }, [filteredDrills, currentPage]);

  const hasAnyActiveFilters = searchQuery !== "" || difficultyFilter !== "All" || categoryFilter !== "All"
    || selectedProblems.length > 0 || selectedGoals.length > 0 || selectedTags.length > 0;

  const handleClearAll = useCallback(() => {
    setSearchQuery("");
    setDifficultyFilter("All");
    setCategoryFilter("All");
    setSelectedProblems([]);
    setSelectedGoals([]);
    setSelectedTags([]);
    setCurrentPage(1);
  }, []);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, difficultyFilter, categoryFilter, selectedProblems, selectedGoals, selectedTags]);

  // ── Active Filter Pills ──
  const renderFilterPills = () => {
    if (!hasAnyActiveFilters) return null;
    const pills: { label: string; onRemove: () => void; variant?: "crimson" | "default" }[] = [];
    if (searchQuery) pills.push({ label: `Search: "${searchQuery}"`, onRemove: () => setSearchQuery("") });
    if (difficultyFilter !== "All") pills.push({ label: difficultyFilter, onRemove: () => setDifficultyFilter("All") });
    if (categoryFilter !== "All") pills.push({ label: categoryFilter, onRemove: () => setCategoryFilter("All") });
    selectedProblems.forEach(val => {
      const opt = filterOptions.problem.find(o => o.value === val);
      pills.push({ label: `Fix: ${opt?.label || val}`, onRemove: () => setSelectedProblems(prev => prev.filter(x => x !== val)), variant: "crimson" });
    });
    selectedGoals.forEach(val => {
      const opt = filterOptions.goal.find(o => o.value === val);
      pills.push({ label: `Skill: ${opt?.label || val}`, onRemove: () => setSelectedGoals(prev => prev.filter(x => x !== val)), variant: "crimson" });
    });
    selectedTags.forEach(val => {
      pills.push({ label: `Focus: ${val.charAt(0).toUpperCase() + val.slice(1)}`, onRemove: () => setSelectedTags(prev => prev.filter(x => x !== val)), variant: "crimson" });
    });
    return (
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {pills.map((pill, i) => (
          <button
            key={i}
            onClick={pill.onRemove}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium min-h-[44px] ${
              pill.variant === "crimson"
                ? "bg-[#e4002b]/15 text-[#e4002b] border border-[#e4002b]/30 hover:bg-[#e4002b]/25"
                : "bg-electric/10 text-electric border border-electric/20 hover:bg-electric/20"
            } transition-all duration-300 group`}
          >
            {pill.label}
            <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
          </button>
        ))}
        <button
          onClick={handleClearAll}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-300 min-h-[44px]"
        >
          Clear all
        </button>
      </div>
    );
  };

  // ── Loading State ──
  if (drillsLoading) {
    return (
      <div className="min-h-screen bg-[#07111F] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
          <p className="text-slate-400 animate-pulse text-sm">Loading drills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col w-full max-w-full overflow-x-hidden">
      {/* ===== SEARCH + FILTERS ===== */}
      <div className="px-4 pt-4 pb-2">
        <div className="max-w-5xl mx-auto">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-electric transition-colors duration-300" />
              </div>
              <Input
                type="text"
                placeholder="Search drills..."
                className="pl-12 py-6 text-base bg-card/80 text-foreground border-border/50 rounded-xl focus-visible:ring-2 focus-visible:ring-electric/50 focus-visible:border-electric/30 font-medium transition-all duration-300 hover:border-electric/20 placeholder:text-muted-foreground/60 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Level Pills */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">Level</span>
              {["All", "Easy", "Medium", "Hard"].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficultyFilter(level)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 min-h-[44px] ${
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

            {/* Skill Category Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">Skill</span>
              {CATEGORIES.map((cat) => {
                const count = cat === "All"
                  ? allDrills.length
                  : allDrills.filter(d => d.categories.includes(cat)).length;
                if (cat !== "All" && count === 0) return null;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 min-h-[44px] ${
                      categoryFilter === cat
                        ? "bg-electric text-white shadow-lg shadow-electric/25"
                        : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground border border-border/50"
                    }`}
                  >
                    {cat === "All" ? "All Skills" : cat}
                    <span className={`ml-1.5 text-[10px] ${categoryFilter === cat ? "text-white/70" : "text-muted-foreground/60"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Advanced Filters Accordion */}
            <div className="pt-1">
              <div className="flex items-center gap-2 mb-3">
                <SlidersHorizontal className="h-3.5 w-3.5 text-electric" />
                <span className="text-xs font-semibold text-electric uppercase tracking-wider">Narrow By Problem, Goal &amp; More</span>
              </div>
              <div className="space-y-3">
                <AccordionFilterCard
                  label="Fix a Problem"
                  subtitle="What are you trying to fix?"
                  options={filterOptions.problem}
                  selected={selectedProblems}
                  onToggle={(v) => toggleMultiSelect(selectedProblems, v, setSelectedProblems)}
                  isOpen={problemOpen}
                  onToggleOpen={() => setProblemOpen(o => !o)}
                />
                <AccordionFilterCard
                  label="Build a Skill"
                  subtitle="What are you building?"
                  options={filterOptions.goal}
                  selected={selectedGoals}
                  onToggle={(v) => toggleMultiSelect(selectedGoals, v, setSelectedGoals)}
                  isOpen={goalOpen}
                  onToggleOpen={() => setGoalOpen(o => !o)}
                />
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
            </div>
          </div>
        </div>
      </div>

      {/* ===== ACTIVE FILTER PILLS ===== */}
      <div className="px-4">
        <div className="max-w-5xl mx-auto">
          {renderFilterPills()}
        </div>
      </div>

      {/* ===== RESULTS HEADER ===== */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-heading font-bold text-foreground">Training Library</h2>
            <span className="text-xs font-semibold text-electric bg-electric/10 px-2.5 py-1 rounded-full">
              {filteredDrills.length} drills
            </span>
          </div>
        </div>
      </div>

      {/* ===== DRILL CARDS GRID ===== */}
      <div className="px-4 pb-6">
        <div className="max-w-5xl mx-auto">
          {paginatedDrills.length > 0 ? (
            <div
              className="gap-5"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 18rem), 1fr))",
              }}
            >
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

                return (
                  <div
                    key={drill.id}
                    className="group relative md:transition-transform md:duration-300 md:hover:-translate-y-1 active:scale-[0.98] transition-transform"
                  >
                    {/* Featured ribbon */}
                    {drill.featured && (
                      <span
                        className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm"
                        style={{ backgroundColor: "oklch(75% 0.15 80)", color: "oklch(15% 0.02 80)" }}
                      >
                        <Star className="h-3 w-3 fill-current" />
                        Featured
                      </span>
                    )}

                    <Link
                      href={`/embed/drill/${drill.id}`}
                      className="block h-full"
                    >
                      <div className="glass-card rounded-xl overflow-hidden drill-card-hover cursor-pointer h-full flex flex-col">
                        {/* Card Image */}
                        <div className="relative h-44 bg-gradient-to-br from-card to-accent overflow-hidden">
                          {imageSource ? (
                            <img
                              src={imageSource}
                              alt={drill.name}
                              className="w-full h-full object-cover object-contain opacity-90 group-hover:scale-108 transition-transform duration-700 ease-out"
                              style={{ maxWidth: "100%" }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <img
                              src={`/images/drills/${drill.id.toLowerCase().replace(/[^a-z0-9]/g, "-")}.jpg`}
                              alt={drill.name}
                              className="w-full h-full object-cover opacity-75 group-hover:scale-108 transition-transform duration-700 ease-out"
                              style={{ maxWidth: "100%" }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          )}
                          {/* Gradient overlays */}
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                          <div className="absolute inset-0 bg-gradient-to-br from-electric/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          {/* Difficulty Badge */}
                          <div className="absolute top-3 right-3">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${diffConfig.class}`}>
                              {displayDifficulty}
                            </span>
                          </div>
                          {/* Duration badge */}
                          {drill.duration && drill.duration !== "Unknown" && (
                            <div className="absolute bottom-3 right-3">
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/50 text-white/80 backdrop-blur-sm">
                                <Clock className="h-2.5 w-2.5" />
                                {drill.duration}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-4 flex-1 flex flex-col">
                          {/* Category */}
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${diffConfig.dotClass}`} />
                            <span className="text-electric text-[10px] font-bold uppercase tracking-wider">
                              {displayCategory}
                            </span>
                          </div>
                          {/* Title */}
                          <h3 className="text-base font-heading font-bold text-foreground mb-2 group-hover:text-electric transition-colors duration-300 leading-tight">
                            {drill.name}
                          </h3>
                          {/* Description */}
                          <p className="text-xs text-muted-foreground mb-3 flex-1 line-clamp-2 leading-relaxed">
                            {displayDescription}
                          </p>
                          {/* Footer */}
                          <div className="flex items-center text-muted-foreground group-hover:text-electric transition-all duration-300 pt-2 border-t border-border/30">
                            <span className="text-xs font-semibold">Start This Drill</span>
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
              <Button onClick={handleClearAll} className="btn-premium text-white text-sm min-h-[44px]">
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ===== PAGINATION ===== */}
      {totalPages > 1 && (
        <div className="px-4 pb-6">
          <div className="max-w-5xl mx-auto flex items-center justify-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-card text-muted-foreground hover:text-foreground hover:bg-accent border border-border/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[44px]"
            >
              Previous
            </button>
            <div className="flex gap-1">
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
                    className={`w-11 h-11 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-electric text-white shadow-lg shadow-electric/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-card text-muted-foreground hover:text-foreground hover:bg-accent border border-border/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[44px]"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
