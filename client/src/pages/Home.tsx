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
        
        <div className="container relative z-10 py-12 md:py-20">
          {/* Auth & Admin Controls */}
          <div className="flex justify-end gap-3 mb-8">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <>
                    <Link href="/coach-dashboard">
                      <Button variant="secondary" size="sm" className="gap-2">
                        <Users className="h-4 w-4" />
                        Coach Dashboard
                      </Button>
                    </Link>
                    <Link href="/admin">
                      <Button variant="secondary" size="sm" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Admin Dashboard
                      </Button>
                    </Link>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={logout} className="gap-2 bg-background/20 hover:bg-background/30">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="secondary" size="sm" className="gap-2">
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
            <h1 className="text-5xl md:text-7xl font-heading font-black mb-4 leading-tight">
              Drills Directory
            </h1>
            <p className="text-lg text-primary-foreground/90 mb-10 max-w-3xl leading-relaxed font-medium">
              {drillsData.length} professional baseball drills. Filter by skill set, difficulty, and duration to build the perfect practice plan.
            </p>
            
            {/* Search Bar in Hero */}
            <div className="relative max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder="Search drills... (e.g., '1-2-3 Drill', 'Bunting', 'Throwing')"
                className="pl-11 py-7 text-base bg-background/95 text-foreground border-0 shadow-2xl rounded-2xl focus-visible:ring-2 focus-visible:ring-secondary font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-8 md:py-12">
        {/* Enhanced Filters */}
        <div className="bg-card border rounded-2xl p-5 md:p-6 shadow-sm mb-10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground font-bold text-lg">
                <Filter className="h-5 w-5 text-secondary" />
                <span>Filter Drills</span>
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
                  className="text-muted-foreground hover:text-foreground gap-1"
                >
                  <X className="h-4 w-4" />
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-2 block">Difficulty</label>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-full">
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
                <label className="text-sm font-semibold text-muted-foreground mb-2 block">Skill Set</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full">
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
                <div className="text-sm text-muted-foreground font-medium">
                  <span className="text-foreground font-bold text-lg">{filteredDrills.length}</span> drills found
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {filteredDrills.length > 0 ? (
          <div>
            <h2 className="text-3xl font-heading font-bold text-foreground mb-8">
              {categoryFilter !== "All" ? `${categoryFilter} Drills` : "All Drills"}
            </h2>
            
            {/* Drills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDrills.map((drill) => {
                const primaryCategory = drill.categories[0];
                const categoryConfig = getCategoryConfig(primaryCategory);
                
                return (
                  <Link 
                    key={drill.id} 
                    href={`/drill/${drill.id}`}
                    className="group block h-full"
                  >
                    <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-l-4 border-l-transparent overflow-hidden flex flex-col">
                      <CardHeader className="pb-3 bg-gradient-to-br from-background to-muted/30">
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <Badge variant="outline" className={`${getDifficultyColor(drill.difficulty)} font-bold border text-xs`}>
                            {drill.difficulty}
                          </Badge>
                          {drill.duration !== "Unknown" && (
                            <div className="flex items-center text-xs font-medium text-muted-foreground bg-background px-2.5 py-1.5 rounded-lg border">
                              <Clock className="h-3 w-3 mr-1.5" />
                              {drill.duration}
                            </div>
                          )}
                        </div>
                        <CardTitle className="text-2xl font-heading font-black leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {drill.name}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="flex-1 pt-4">
                        <div className="flex flex-wrap gap-2">
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
                      
                      <CardFooter className="pt-3 pb-4 text-sm text-muted-foreground flex items-center justify-between border-t bg-muted/20 mt-auto p-4">
                        <span className="flex items-center gap-1.5 group-hover:text-secondary transition-colors font-bold text-foreground">
                          View Details
                        </span>
                        <ChevronRight className="h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 text-secondary" />
                      </CardFooter>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-24 bg-muted/30 rounded-2xl border-2 border-dashed">
            <div className="bg-muted h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-heading font-bold mb-3">No drills found</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8 text-lg">
              We couldn't find any drills matching your search criteria. Try adjusting your filters or search term.
            </p>
            <Button 
              onClick={() => {
                setSearchQuery("");
                setDifficultyFilter("All");
                setCategoryFilter("All");
              }}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Clear Filters
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
