import { useState, useMemo, useCallback } from "react";
import { Link } from "wouter";
import { Search, Filter, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAllDrills } from "@/hooks/useAllDrills";
import { getCategoryConfig } from "@/lib/categoryColors";

const DRILLS_PER_PAGE = 18;

/**
 * /embed/drills — Streamlined drill library for iframe embedding.
 * No site header/footer. Compact layout. All navigation stays within /embed/*.
 */
export default function EmbedDrillLibrary() {
  const allDrills = useAllDrills();
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    allDrills.forEach((d) => d.categories.forEach((c) => cats.add(c)));
    return ["All", ...Array.from(cats).sort()];
  }, [allDrills]);

  const filteredDrills = useMemo(() => {
    return allDrills.filter((drill) => {
      const matchesSearch = drill.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = difficultyFilter === "All" || drill.difficulty === difficultyFilter;
      const matchesCategory = categoryFilter === "All" || drill.categories.includes(categoryFilter);
      return matchesSearch && matchesDifficulty && matchesCategory;
    });
  }, [allDrills, searchQuery, difficultyFilter, categoryFilter]);

  const totalPages = Math.ceil(filteredDrills.length / DRILLS_PER_PAGE);
  const paginatedDrills = useMemo(() => {
    const start = (currentPage - 1) * DRILLS_PER_PAGE;
    return filteredDrills.slice(start, start + DRILLS_PER_PAGE);
  }, [filteredDrills, currentPage]);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setDifficultyFilter("All");
    setCategoryFilter("All");
    setCurrentPage(1);
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-700 border-green-200";
      case "Medium": return "bg-amber-100 text-amber-700 border-amber-200";
      case "Hard": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const hasActiveFilters = difficultyFilter !== "All" || categoryFilter !== "All" || searchQuery !== "";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Compact Search Bar */}
      <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-3 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Link href="/embed" className="shrink-0">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white px-2">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type="text"
                placeholder="Search drills..."
                className="pl-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`shrink-0 px-2 ${hasActiveFilters ? "text-red-400" : "text-slate-400"} hover:text-white`}
            >
              <Filter className="w-4 h-4" />
              {hasActiveFilters && (
                <span className="ml-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <div className="flex flex-wrap gap-1.5">
                {["All", "Easy", "Medium", "Hard"].map((d) => (
                  <button
                    key={d}
                    onClick={() => { setDifficultyFilter(d); setCurrentPage(1); }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      difficultyFilter === d
                        ? "bg-red-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                    }`}
                  >
                    {d === "All" ? "All Levels" : d}
                  </button>
                ))}
              </div>
              <div className="h-4 w-px bg-slate-700 mx-1" />
              <div className="flex flex-wrap gap-1.5">
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      categoryFilter === cat
                        ? "bg-red-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                    }`}
                  >
                    {cat === "All" ? "All Categories" : cat}
                  </button>
                ))}
              </div>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-2.5 py-1 rounded-md text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {filteredDrills.length} drill{filteredDrills.length !== 1 ? "s" : ""}
              {hasActiveFilters ? " (filtered)" : ""}
            </span>
            {totalPages > 1 && (
              <span className="text-xs text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Drill Grid */}
      <div className="flex-1 px-3 py-4">
        <div className="max-w-6xl mx-auto">
          {paginatedDrills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedDrills.map((drill) => {
                const slug = drill.name
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, "");
                const catConfig = getCategoryConfig(drill.categories[0] || "");

                return (
                  <Link
                    key={drill.id}
                    href={`/embed/drill/${slug}`}
                    className="group block"
                  >
                    <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-4 h-full transition-all duration-200 hover:bg-slate-800/70 hover:border-slate-600/60 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold leading-tight group-hover:text-red-400 transition-colors line-clamp-2">
                          {drill.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`${getDifficultyColor(drill.difficulty)} text-[10px] px-1.5 py-0 shrink-0 border`}
                        >
                          {drill.difficulty}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {drill.categories.map((cat, idx) => {
                          const cc = getCategoryConfig(cat);
                          return (
                            <span
                              key={idx}
                              className={`text-[10px] px-2 py-0.5 rounded-full border ${cc.bgColor} ${cc.color}`}
                            >
                              {cat}
                            </span>
                          );
                        })}
                        {drill.duration && drill.duration !== "Unknown" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            {drill.duration}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm mb-3">No drills found matching your criteria.</p>
              <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs">
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 px-3 py-2">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="text-slate-400 hover:text-white h-8 px-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let page: number;
                if (totalPages <= 7) {
                  page = i + 1;
                } else if (currentPage <= 4) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  page = totalPages - 6 + i;
                } else {
                  page = currentPage - 3 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                      currentPage === page
                        ? "bg-red-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="text-slate-400 hover:text-white h-8 px-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <div className="text-center py-2 px-3">
        <p className="text-[10px] text-slate-700">
          Powered by{" "}
          <a
            href="https://coachstevemobilecoach.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-red-400 transition-colors"
          >
            Coach Steve's Hitters Lab
          </a>
        </p>
      </div>
    </div>
  );
}
