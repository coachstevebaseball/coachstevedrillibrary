import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { useAllDrills } from "@/hooks/useAllDrills";

// Get difficulty color pill
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Easy": return "bg-green-500";
    case "Medium": return "bg-orange-500";
    case "Hard": return "bg-red-500";
    default: return "bg-gray-500";
  }
};

export default function EmbedDrillLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const DRILLS_PER_PAGE = 20;

  const allDrills = useAllDrills();

  // Extract unique categories
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    allDrills.forEach(drill => {
      drill.categories.forEach(cat => categories.add(cat));
    });
    return ["All", ...Array.from(categories).sort()];
  }, [allDrills]);

  // Filter drills
  const filteredDrills = useMemo(() => {
    return allDrills.filter(drill => {
      const matchesSearch = drill.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = difficultyFilter === "All" || drill.difficulty === difficultyFilter;
      const matchesCategory = categoryFilter === "All" || drill.categories.includes(categoryFilter);
      return matchesSearch && matchesDifficulty && matchesCategory;
    });
  }, [allDrills, searchQuery, difficultyFilter, categoryFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredDrills.length / DRILLS_PER_PAGE);
  const startIndex = (currentPage - 1) * DRILLS_PER_PAGE;
  const paginatedDrills = filteredDrills.slice(startIndex, startIndex + DRILLS_PER_PAGE);

  const handleFilterChange = (setter: any, value: any) => {
    setCurrentPage(1);
    setter(value);
  };

  const hasActiveFilters = searchQuery !== "" || difficultyFilter !== "All" || categoryFilter !== "All";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Compact Search & Filter Bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
        <div className="px-4 py-3">
          {/* Search + Filter Row */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder="Search drills..."
                className="pl-9 py-2 text-sm bg-muted/50 border-0 rounded-lg focus-visible:ring-1 focus-visible:ring-secondary"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1.5 shrink-0 text-xs"
            >
              <Filter className="h-3.5 w-3.5" />
              Filter
              <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <Select value={difficultyFilter} onValueChange={(v) => handleFilterChange(setDifficultyFilter, v)}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Difficulties</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={(v) => handleFilterChange(setCategoryFilter, v)}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Skill Set" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => {
                    setSearchQuery("");
                    setDifficultyFilter("All");
                    setCategoryFilter("All");
                    setCurrentPage(1);
                  }}
                >
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
          )}

          {/* Results count */}
          <div className="mt-2 text-xs text-muted-foreground">
            {filteredDrills.length} drill{filteredDrills.length !== 1 ? "s" : ""}
            {hasActiveFilters && " (filtered)"}
          </div>
        </div>
      </div>

      {/* Drills Grid */}
      <div className="px-4 py-4">
        {paginatedDrills.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedDrills.map((drill) => (
                <Link
                  key={drill.id}
                  href={`/embed/drill/${drill.id}`}
                  className="group block h-full"
                >
                  <div className="bg-card border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 h-full flex flex-col hover:border-secondary/50">
                    <div className="p-3 sm:p-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <Badge className={`${getDifficultyColor(drill.difficulty)} text-white font-semibold text-[10px] px-2 py-0.5`}>
                          {drill.difficulty}
                        </Badge>
                        {drill.duration && drill.duration !== "Unknown" && (
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {drill.duration}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                        {drill.name}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {drill.categories.map((cat, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1.5 mt-6 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    // Smart pagination: show first, last, and pages around current
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
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 text-xs p-0"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-bold mb-1">No drills found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your filters or search term.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setDifficultyFilter("All");
                setCategoryFilter("All");
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Minimal branding footer */}
      <div className="px-4 py-3 text-center border-t">
        <a
          href="https://coachstevemobilecoach.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Powered by Coach Steve's Drill Library
        </a>
      </div>
    </div>
  );
}
