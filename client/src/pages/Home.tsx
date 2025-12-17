import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ExternalLink, Clock, Activity, Dumbbell, Users, ChevronRight, LogIn, LogOut, Shield } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import drillsData from "@/data/drills.json";

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
        
        <div className="container relative z-10 py-16 md:py-24">
          {/* Auth & Admin Controls */}
          <div className="flex justify-end gap-3 mb-8">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link href="/admin">
                    <Button variant="secondary" size="sm" className="gap-2">
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </Button>
                  </Link>
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
          
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-12 bg-secondary rounded-full" />
              <span className="text-secondary font-bold tracking-wider uppercase text-sm">Coach Steve's Mobile Coach</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6 leading-tight">
              Drills Directory
            </h1>
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl leading-relaxed">
              Access the complete library of {drillsData.length} professional baseball drills. 
              Filter by skill set, difficulty, and duration to build the perfect practice plan.
            </p>
            
            {/* Search Bar in Hero */}
            <div className="relative max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder="Search for a drill (e.g., '1-2-3 Drill', 'Bunting')..."
                className="pl-11 py-6 text-lg bg-background/95 text-foreground border-0 shadow-xl rounded-xl focus-visible:ring-2 focus-visible:ring-secondary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-12">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <Filter className="h-5 w-5" />
            <span>Filters:</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Difficulties</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setDifficultyFilter("All");
                setCategoryFilter("All");
              }}
              className="whitespace-nowrap"
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold text-foreground">
            Available Drills
            <span className="ml-3 text-lg font-normal text-muted-foreground bg-muted px-3 py-1 rounded-full">
              {filteredDrills.length}
            </span>
          </h2>
        </div>

        {/* Drills Grid */}
        {filteredDrills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrills.map((drill) => (
              <Link 
                key={drill.id} 
                href={`/drill/${drill.id}`}
                className="group block h-full"
              >
                <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-l-4 border-l-transparent hover:border-l-secondary overflow-hidden flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <Badge variant="outline" className={`${getDifficultyColor(drill.difficulty)} font-medium border`}>
                        {drill.difficulty}
                      </Badge>
                      {drill.duration !== "Unknown" && (
                        <div className="flex items-center text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                          <Clock className="h-3 w-3 mr-1" />
                          {drill.duration}
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-xl font-heading leading-tight group-hover:text-primary transition-colors">
                      {drill.name}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    <div className="flex flex-wrap gap-2 mt-2">
                      {drill.categories.map((cat, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted/80 font-normal">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-0 pb-4 text-sm text-muted-foreground flex items-center justify-between border-t bg-muted/10 mt-auto p-4">
                    <span className="flex items-center gap-1.5 group-hover:text-secondary transition-colors font-medium">
                      View Drill Details
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-secondary" />
                  </CardFooter>
                </Card>
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
              We couldn't find any drills matching your search criteria. Try adjusting your filters or search term.
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
                <p className="text-sm text-primary-foreground/60">Unofficial Directory Tool</p>
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
