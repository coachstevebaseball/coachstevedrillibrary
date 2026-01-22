import { useAuth } from "@/_core/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, LogIn, LogOut, Shield, X, Users, Activity, ChevronDown } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import drillsData from "@/data/drills.json";
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

// Get difficulty color pill
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Easy": return "bg-green-500";
    case "Medium": return "bg-orange-500";
    case "Hard": return "bg-red-500";
    default: return "bg-gray-500";
  }
};

// Get category color pill
const getCategoryColor = (category: string) => {
  return "bg-teal-500";
};

export default function Home() {
  // IMPORTANT: All hooks must be called before any conditional returns
  const { user, loading, error, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
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

  const hasActiveFilters = searchQuery !== "" || difficultyFilter !== "All" || categoryFilter !== "All";

  // NOW we can do conditional returns after all hooks are called

  // Redirect unauthenticated users to login
  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4">Access Restricted</h1>
          <p className="text-lg text-muted-foreground mb-8">
            This content is exclusive to invited athletes. Please log in to access the drill library.
          </p>
          <Button onClick={() => window.location.href = getLoginUrl()} size="lg">
            <LogIn className="h-5 w-5 mr-2" />
            Log In
          </Button>
        </div>
      </div>
    );
  }

  // Check if user is an active athlete
  if (!loading && isAuthenticated && user?.role === 'athlete' && !user?.isActiveClient) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4">Account Inactive</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Your account has been deactivated. Please contact your coach for more information.
          </p>
          <Button onClick={() => logout()} variant="outline" size="lg">
            <LogOut className="h-5 w-5 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    );
  }

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
        {/* Add Filter Button */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 font-semibold"
          >
            <Filter className="h-4 w-4" />
            Add Filter
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Filters Section - Collapsible */}
        {showFilters && (
          <div className="bg-card border rounded-lg p-4 md:p-6 shadow-sm mb-8 md:mb-10">
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

              {hasActiveFilters && (
                <div className="flex items-end">
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
                    <X className="h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg md:text-2xl font-heading font-bold text-foreground">
            Available Drills
            <span className="ml-3 text-sm md:text-lg font-normal text-muted-foreground bg-muted px-3 py-1 rounded-full">
              {filteredDrills.length}
            </span>
          </h2>
        </div>

        {/* Drills List */}
        {paginatedDrills.length > 0 ? (
          <div className="space-y-3">
            {paginatedDrills.map((drill) => (
              <Link 
                key={drill.id} 
                href={`/drill/${drill.id}`}
                className="group block"
              >
                <div className="border-l-4 border-l-transparent hover:border-l-secondary transition-colors p-4 rounded-lg hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base md:text-lg font-heading font-semibold group-hover:text-secondary transition-colors mb-2">
                        {drill.name}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-slate-900 text-white text-xs">DRILL</Badge>
                        <Badge className={`${getDifficultyColor(drill.difficulty)} text-white text-xs`}>
                          {drill.difficulty}
                        </Badge>
                        {drill.categories.map((cat, idx) => (
                          <Badge key={idx} className={`${getCategoryColor(cat)} text-white text-xs`}>
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
            <div className="bg-muted h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No drills found</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              We could not find any drills matching your search criteria. Try adjusting your filters or search term.
            </p>
            <Button 
              onClick={() => {
                setSearchQuery("");
                setDifficultyFilter("All");
                setCategoryFilter("All");
              }}
            >
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12 mt-auto border-t border-primary-foreground/10">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-secondary rounded flex items-center justify-center font-heading font-bold text-xl">
                USAB
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg">USA Baseball Drills Directory</h3>
                <p className="text-sm text-primary-foreground/60">Coach Steve Baseball — Player Drill Library</p>
              </div>
            </div>
            
            <div className="text-sm text-primary-foreground/60 text-center md:text-right">
              <p>Data sourced from USA Baseball Mobile Coach.</p>
              <p className="mt-1">© {new Date().getFullYear()} All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
