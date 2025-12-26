import { useAuth } from "@/_core/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ExternalLink, Clock, Activity, Dumbbell, Users, ChevronRight, LogIn, LogOut, Shield, X } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import drillsData from "@/data/drills.json";
import { getCategoryConfig } from "@/lib/categoryColors";
import { useState, useMemo } from "react";

// Types
interface Drill {
  id: string;
  name: string;
  difficulty: string;
  categories: string[];
  duration: string;
  url: string;
  is_direct_link: boolean;
}

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const DRILLS_PER_PAGE = 20;

  // Extract unique categories
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    drillsData.forEach(drill => {
      drill.categories.forEach(cat => categories.add(cat));
    });
    return ["All", ...Array.from(categories).sort()];
  }, []);

  // Filter drills
  const filteredDrills = useMemo(() => {
    return drillsData.filter(drill => {
      const matchesSearch = drill.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = difficultyFilter === "All" || drill.difficulty === difficultyFilter;
      const matchesCategory = categoryFilter === "All" || drill.categories.includes(categoryFilter);
      return matchesSearch && matchesDifficulty && matchesCategory;
    });
  }, [searchQuery, difficultyFilter, categoryFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredDrills.length / DRILLS_PER_PAGE);
  const startIndex = (currentPage - 1) * DRILLS_PER_PAGE;
  const endIndex = startIndex + DRILLS_PER_PAGE;
  const paginatedDrills = filteredDrills.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: any, value: any) => {
    setCurrentPage(1);
    setter(value);
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
      case "Hard": return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      default: return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
    }
  };

  const hasActiveFilters = searchQuery !== "" || difficultyFilter !== "All" || categoryFilter !== "All";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <header className="relative bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero-bg.jpg" 
            alt="Baseball Field" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary/95" />
        </div>
        
        <div className="container relative z-10 py-8 md:py-20">
          {/* Auth & Admin Controls */}
          <div className="flex justify-end gap-2 mb-6 flex-wrap">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <>
                    <Link href="/coach-dashboard">
                      <Button variant="secondary" size="sm" className="gap-2 text-xs md:text-sm">
                        <Users className="h-4 w-4" />
                        Coach Dashboard
                      </Button>
                    </Link>
                    <Link href="/admin">
                      <Button variant="secondary" size="sm" className="gap-2 text-xs md:text-sm">
                        <Shield className="h-4 w-4" />
                        <span className="hidden sm:inline">Admin Dashboard</span>
                        <span className="sm:hidden">Admin</span>
                      </Button>
                    </Link>
                  </>
                )}
                {user.role === 'athlete' && (
                  <Link href="/athlete-portal">
                    <Button variant="secondary" size="sm" className="gap-2 text-xs md:text-sm">
                      <Activity className="h-4 w-4" />
                      <span className="hidden sm:inline">My Drills</span>
                      <span className="sm:hidden">Drills</span>
                    </Button>
                  </Link>
                )}
                <Button variant="outline" size="sm" onClick={logout} className="gap-2 bg-background/20 hover:bg-background/30 text-xs md:text-sm">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">Exit</span>
                </Button>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="secondary" size="sm" className="gap-2 text-xs md:text-sm">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </a>
            )}
          </div>
          
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-1 w-12 bg-secondary rounded-full" />
              <span className="text-secondary font-bold tracking-wider uppercase text-xs">Coach Steve's Mobile Coach</span>
            </div>
            <h1 className="text-4xl md:text-7xl font-heading font-black mb-3 md:mb-4 leading-tight">
              Drills Directory
            </h1>
            <p className="text-base md:text-lg text-primary-foreground/90 mb-6 md:mb-10 max-w-3xl leading-relaxed font-medium">
              {drillsData.length} professional baseball drills. Filter by skill set, difficulty, and duration to build the perfect practice plan.
            </p>
            
            {/* Search Bar in Hero */}
            <div className="relative w-full md:max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder="Search drills..."
                className="pl-11 py-5 md:py-7 text-sm md:text-base bg-background/95 text-foreground border-0 shadow-2xl rounded-xl md:rounded-2xl focus-visible:ring-2 focus-visible:ring-secondary font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-6 md:py-12">
        {/* Enhanced Filters */}
        <div className="bg-card border rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm mb-8 md:mb-10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-foreground font-bold text-base md:text-lg">
                <Filter className="h-4 md:h-5 w-4 md:w-5 text-secondary" />
                <span>Filter</span>
              </div>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setDifficultyFilter("All");
                    setCategoryFilter("All");
                  }}
                  className="text-muted-foreground hover:text-foreground gap-1 text-xs md:text-sm"
                >
                  <X className="h-3 md:h-4 w-3 md:w-4" />
                  <span className="hidden sm:inline">Clear All</span>
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <div>
                <label className="text-xs md:text-sm font-semibold text-muted-foreground mb-1.5 md:mb-2 block">Difficulty</label>
                <Select value={difficultyFilter} onValueChange={(value) => handleFilterChange(setDifficultyFilter, value)}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="All Difficulties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Difficulties</SelectItem>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs md:text-sm font-semibold text-muted-foreground mb-1.5 md:mb-2 block">Skill Set</label>
                <Select value={categoryFilter} onValueChange={(value) => handleFilterChange(setCategoryFilter, value)}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="All Skill Sets" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <div className="text-xs md:text-sm text-muted-foreground font-medium">
                  <span className="text-foreground font-bold text-base md:text-lg">{filteredDrills.length}</span> <span className="hidden sm:inline">drills found</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {filteredDrills.length > 0 ? (
          <div>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-6 md:mb-8">
              {categoryFilter !== "All" ? `${categoryFilter} Drills` : "All Drills"}
            </h2>
            
            {/* Drills Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {paginatedDrills.map((drill) => {
                const primaryCategory = drill.categories[0];
                const categoryConfig = getCategoryConfig(primaryCategory);
                
                return (
                  <Link 
                    key={drill.id} 
                    href={`/drill/${drill.id}`}
                    className="group block h-full"
                  >
                    <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 md:hover:shadow-xl md:hover:-translate-y-2 border-l-4 border-l-transparent overflow-hidden flex flex-col">
                      <CardHeader className="pb-2 md:pb-3 bg-gradient-to-br from-background to-muted/30">
                        <div className="flex justify-between items-start gap-2 mb-2 md:mb-3">
                          <Badge variant="outline" className={`${getDifficultyColor(drill.difficulty)} font-bold border text-xs`}>
                            {drill.difficulty}
                          </Badge>
                          {drill.duration !== "Unknown" && (
                            <div className="flex items-center text-xs font-medium text-muted-foreground bg-background px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg border">
                              <Clock className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">{drill.duration}</span>
                            </div>
                          )}
                        </div>
                        <CardTitle className="text-lg md:text-2xl font-heading font-black leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {drill.name}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="flex-1 pt-3 md:pt-4">
                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                          {drill.categories.map((cat, idx) => {
                            const config = getCategoryConfig(cat);
                            return (
                              <Badge 
                                key={idx} 
                                className={`${config.bgColor} ${config.color} font-semibold text-xs border`}
                              >
                                {cat}
                              </Badge>
                            );
                          })}
                        </div>
                      </CardContent>
                      
                      <CardFooter className="pt-2 md:pt-3 pb-3 md:pb-4 text-sm text-muted-foreground flex items-center justify-between border-t bg-muted/20 mt-auto p-3 md:p-4">
                        <span className="flex items-center gap-1 md:gap-1.5 group-hover:text-secondary transition-colors font-bold text-foreground text-sm md:text-base">
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">View</span>
                        </span>
                        <ChevronRight className="h-4 md:h-5 w-4 md:w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 text-secondary" />
                      </CardFooter>
                    </Card>
                  </Link>
                );
              })}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 mt-8 md:mt-12 pt-6 md:pt-8 border-t">
                <div className="text-xs md:text-sm text-muted-foreground font-medium text-center md:text-left">
                  <div className="md:hidden mb-2">Page <span className="font-bold text-foreground">{currentPage}</span>/<span className="font-bold text-foreground">{totalPages}</span></div>
                  <div className="hidden md:block">Page <span className="font-bold text-foreground">{currentPage}</span> of <span className="font-bold text-foreground">{totalPages}</span></div>
                  <div className="text-xs mt-1 md:ml-4 md:mt-0 md:inline">Showing {startIndex + 1}-{Math.min(endIndex, filteredDrills.length)} of {filteredDrills.length}</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="gap-2 text-sm flex-1 sm:flex-none"
                    size="sm"
                  >
                    <span className="hidden sm:inline">← Previous</span>
                    <span className="sm:hidden">← Prev</span>
                  </Button>
                  <div className="flex items-center gap-1 overflow-x-auto justify-center">
                    {totalPages <= 5 ? (
                      Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button
                          key={`page-${page}`}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="min-w-9 text-xs md:text-sm"
                        >
                          {page}
                        </Button>
                      ))
                    ) : (
                      <>
                        {currentPage > 2 && (
                          <>
                            <Button
                              key="page-first"
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(1)}
                              className="min-w-9 text-xs md:text-sm"
                            >
                              1
                            </Button>
                            {currentPage > 3 && <span key="ellipsis-start" className="text-muted-foreground px-1">...</span>}
                          </>
                        )}
                        {Array.from({ length: Math.min(3, totalPages) }, (_, i) => Math.max(1, currentPage - 1 + i)).map((page, idx) => (
                          page <= totalPages && (
                            <Button
                              key={`page-current-${idx}`}
                              variant={page === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="min-w-9 text-xs md:text-sm"
                            >
                              {page}
                            </Button>
                          )
                        ))}
                        {currentPage < totalPages - 1 && (
                          <>
                            {currentPage < totalPages - 2 && <span key="ellipsis-end" className="text-muted-foreground px-1">...</span>}
                            <Button
                              key="page-last"
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(totalPages)}
                              className="min-w-9 text-xs md:text-sm"
                            >
                              {totalPages}
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="gap-2 text-sm flex-1 sm:flex-none"
                    size="sm"
                  >
                    <span className="hidden sm:inline">Next →</span>
                    <span className="sm:hidden">Next →</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 md:py-24 bg-muted/30 rounded-xl md:rounded-2xl border-2 border-dashed">
            <div className="bg-muted h-16 md:h-20 w-16 md:w-20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Search className="h-8 md:h-10 w-8 md:w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl md:text-2xl font-heading font-bold mb-2 md:mb-3">No drills found</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6 md:mb-8 text-sm md:text-lg">
              We couldn't find any drills matching your search criteria. Try adjusting your filters or search term.
            </p>
            <Button 
              onClick={() => {
                setSearchQuery("");
                setDifficultyFilter("All");
                setCategoryFilter("All");
              }}
              size="sm"
              className="text-sm"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-muted/50 border-t py-8 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Data sourced from USA Baseball Mobile Coach.</p>
        </div>
      </footer>
    </div>
  );
}
