import { useAuth } from "@/_core/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, LogIn, LogOut, Shield, Users, Activity, ChevronRight, Sparkles, Settings } from "lucide-react";
import { HomePageSkeleton } from "@/components/Skeleton";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import drillsData from "@/data/drills.json";
import { useState, useMemo, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { DrillEditModal } from "@/components/DrillEditModal";
import { Pencil } from "lucide-react";

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
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const DRILLS_PER_PAGE = 20;

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDrill, setEditingDrill] = useState<Drill | null>(null);

  // Fetch drill customizations
  const { data: drillCustomizations = [], refetch: refetchCustomizations } = trpc.drillCustomizations.getAll.useQuery();

  // Create a map for quick lookup of customizations
  const customizationsMap = useMemo(() => {
    const map = new Map<string, typeof drillCustomizations[0]>();
    drillCustomizations.forEach((c) => {
      map.set(c.drillId, c);
    });
    return map;
  }, [drillCustomizations]);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch custom drills from database
  const { data: customDrills = [] } = trpc.drillDetails.getCustomDrills.useQuery();

  // Merge static drills with custom drills from database
  const allDrills: Drill[] = useMemo(() => {
    const customDrillsFormatted: Drill[] = customDrills.map((cd: any) => ({
      id: cd.drillId,
      name: cd.name,
      difficulty: cd.difficulty,
      categories: [cd.category],
      duration: cd.duration,
      url: `/drill/${cd.drillId}`,
      is_direct_link: true,
    }));
    return [...drillsData, ...customDrillsFormatted];
  }, [customDrills]);

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


  // Loading state with skeleton
  if (loading) {
    return <HomePageSkeleton />;
  }

  // Unauthenticated view
  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-electric/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        
        <div className="text-center max-w-md relative z-10 animate-fade-in-up">
          <div className="glass-card p-8 rounded-2xl">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-electric animate-float" />
            <h1 className="text-4xl font-bold mb-4 text-gradient">Access Restricted</h1>
            <p className="text-lg text-muted-foreground mb-8">
              This content is exclusive to invited athletes. Please log in to access the drill library.
            </p>
            <Button 
              onClick={() => window.location.href = getLoginUrl()} 
              size="lg"
              className="btn-glow bg-secondary hover:bg-secondary/90 text-white"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Log In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Inactive athlete view
  if (!loading && isAuthenticated && user?.role === 'athlete' && !user?.isActiveClient) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-destructive/10 rounded-full blur-3xl" />
        
        <div className="text-center max-w-md relative z-10 animate-fade-in-up">
          <div className="glass-card p-8 rounded-2xl">
            <h1 className="text-4xl font-bold mb-4">Account Inactive</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Your account has been deactivated. Please contact your coach for more information.
            </p>
            <Button onClick={() => logout()} variant="outline" size="lg" className="hover-lift">
              <LogOut className="h-5 w-5 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section with Parallax */}
      <header ref={heroRef} className="relative overflow-hidden gradient-hero">
        {/* Animated background elements */}
        <div className="absolute inset-0 z-0">
          {/* Parallax background image */}
          <img 
            src="/images/hero-bg.jpg" 
            alt="Baseball Field" 
            className="w-full h-full object-cover opacity-20"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
          <div className="absolute inset-0 gradient-glow" />
        </div>
        
        {/* Floating orbs for depth */}
        <div 
          className="absolute top-20 right-20 w-64 h-64 bg-electric/10 rounded-full blur-3xl animate-float"
          style={{ transform: `translateY(${scrollY * -0.1}px)` }}
        />
        <div 
          className="absolute bottom-10 left-10 w-48 h-48 bg-secondary/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '1.5s', transform: `translateY(${scrollY * -0.15}px)` }}
        />
        
        <div className="container relative z-10 py-8 md:py-20">
          {/* Auth & Admin Controls */}
          <div className="flex justify-end gap-2 mb-6 flex-wrap animate-fade-in-down">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <>
                    <Link href="/coach-dashboard">
                      <Button variant="outline" size="sm" className="gap-2 text-xs md:text-sm glass hover:bg-white/10 border-white/20 hover-lift">
                        <Users className="h-4 w-4" />
                        Coach Dashboard
                      </Button>
                    </Link>
                    <Link href="/admin">
                      <Button variant="outline" size="sm" className="gap-2 text-xs md:text-sm glass hover:bg-white/10 border-white/20 hover-lift">
                        <Shield className="h-4 w-4" />
                        <span className="hidden sm:inline">Admin Dashboard</span>
                        <span className="sm:hidden">Admin</span>
                      </Button>
                    </Link>
                  </>
                )}
                {user.role === 'athlete' && (
                  <Link href="/athlete-portal">
                    <Button size="sm" className="gap-2 text-xs md:text-sm btn-glow bg-secondary hover:bg-secondary/90">
                      <Activity className="h-4 w-4" />
                      <span className="hidden sm:inline">My Drills</span>
                      <span className="sm:hidden">Drills</span>
                    </Button>
                  </Link>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={logout} 
                  className="gap-2 glass hover:bg-white/10 border-white/20 text-xs md:text-sm hover-lift"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">Exit</span>
                </Button>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm" className="gap-2 text-xs md:text-sm btn-glow bg-secondary hover:bg-secondary/90">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </a>
            )}
          </div>
          
          <div className="max-w-4xl mx-auto text-center">
            {/* Next Gen Training Badge */}
            <div className="flex justify-center mb-8 animate-fade-in-down stagger-1">
              <div className="inline-flex items-center px-6 py-3 rounded-full border border-electric/30 bg-electric/10 backdrop-blur-sm">
                <span className="text-electric font-bold tracking-widest uppercase text-xs md:text-sm">Next Gen Training</span>
              </div>
            </div>
            
            {/* Main heading - "UNLEASH YOUR" on line 1, "POTENTIAL" on line 2 */}
            <div className="animate-fade-in-up stagger-2">
              <h1 className="font-heading font-black tracking-tight">
                <span className="block text-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-tight">
                  UNLEASH YOUR
                </span>
                <span className="block text-electric text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-tight mt-2">
                  POTENTIAL
                </span>
              </h1>
            </div>
            
            <p className="text-base md:text-xl text-muted-foreground mt-8 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up stagger-3">
              The ultimate library of professional hitting drills designed to build{" "}
              <span className="text-white font-bold">elite mechanics</span>,{" "}
              <span className="text-white font-bold">explosive power</span>, and{" "}
              <span className="text-white font-bold">game-ready confidence</span>.
            </p>
            

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-6 md:py-12">
        {/* Section Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-heading font-black italic text-electric mb-3">Training Library</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Browse our curated collection of professional drills designed to elevate every aspect of your game.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder="Search for drills..."
              className="pl-12 py-6 text-base glass-card text-foreground border-white/10 shadow-xl rounded-xl focus-visible:ring-2 focus-visible:ring-electric font-medium transition-all duration-300 hover:border-electric/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Section */}
        <div className="glass-card rounded-xl p-6 mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {/* Difficulty Filter */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">Difficulty</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {["All", "Easy", "Medium", "Hard"].map((level) => (
                <button
                  key={level}
                  onClick={() => handleFilterChange(setDifficultyFilter, level)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    difficultyFilter === level
                      ? level === "Easy" 
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                        : level === "Medium"
                        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                        : level === "Hard"
                        ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                        : "bg-electric text-white shadow-lg shadow-electric/30"
                      : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">Category</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {["All", "Hitting", "Bunting", "Pitching", "Infield", "Outfield", "Catching", "Base Running"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleFilterChange(setCategoryFilter, cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    categoryFilter === cat
                      ? "bg-electric text-white shadow-lg shadow-electric/30"
                      : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {cat === "All" ? "All Categories" : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <p className="text-muted-foreground">
            Found <span className="text-electric font-bold">{filteredDrills.length}</span> drills
          </p>
        </div>

        {/* Drills Card Grid */}
        {paginatedDrills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedDrills.map((drill, index) => {
              const customization = customizationsMap.get(drill.id);
              const displayDifficulty = customization?.difficulty || drill.difficulty;
              const displayCategory = customization?.category || drill.categories[0] || "General";
              const displayDescription = customization?.briefDescription || `Master this drill to improve your ${drill.categories[0]?.toLowerCase() || "baseball"} skills.`;
              const thumbnailUrl = customization?.thumbnailUrl;

              return (
                <div 
                  key={drill.id}
                  className="group block animate-fade-in-up relative"
                  style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                >
                  {/* Edit Button for Admins */}
                  {user?.role === 'admin' && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingDrill(drill);
                        setEditModalOpen(true);
                      }}
                      className="absolute top-3 left-3 z-20 p-2 rounded-full bg-black/60 hover:bg-electric/80 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                      title="Edit drill card"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}

                  <Link 
                    href={`/drill/${drill.id}`}
                    className="block h-full"
                  >
                    <div className="glass-card rounded-xl overflow-hidden transition-all duration-300 drill-card-hover cursor-pointer h-full flex flex-col border border-transparent">
                      {/* Card Image */}
                      <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                        {thumbnailUrl ? (
                          <img 
                            src={thumbnailUrl}
                            alt={drill.name}
                            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <img 
                            src={`/images/drills/${drill.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`}
                            alt={drill.name}
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        )}
                        {/* Fallback gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                        
                        {/* Difficulty Badge */}
                        <div className="absolute top-3 right-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            displayDifficulty === "Easy" 
                              ? "bg-emerald-500 text-white"
                              : displayDifficulty === "Medium"
                              ? "bg-amber-500 text-white"
                              : "bg-rose-500 text-white"
                          }`}>
                            {displayDifficulty}
                          </span>
                        </div>
                      </div>
                      
                      {/* Card Content */}
                      <div className="p-5 flex-1 flex flex-col">
                        {/* Category Tag */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 rounded-full bg-electric" />
                          <span className="text-electric text-xs font-bold uppercase tracking-wider">
                            {displayCategory}
                          </span>
                        </div>
                        
                        {/* Title */}
                        <h3 className="text-lg font-heading font-bold text-white mb-2 group-hover:text-electric transition-colors duration-300">
                          {drill.name}
                        </h3>
                        
                        {/* Description */}
                        <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-2">
                          {displayDescription}
                        </p>
                        
                        {/* View Details Link */}
                        <div className="flex items-center text-muted-foreground group-hover:text-electric transition-colors duration-300">
                          <span className="text-sm font-medium">View Details</span>
                          <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 glass-card rounded-2xl border-dashed border-2 border-border/50">
            <div className="bg-muted/30 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
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
              className="btn-glow bg-secondary hover:bg-secondary/90"
            >
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Pagination with hover effects */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="glass border-white/10 hover:border-electric/30 hover-lift disabled:opacity-50"
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              Page <span className="text-electric font-semibold">{currentPage}</span> of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="glass border-white/10 hover:border-electric/30 hover-lift disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        )}
      </main>

      {/* Footer with gradient */}
      <footer className="relative py-12 mt-auto border-t border-border/30 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-card/50 to-transparent" />
        
        <div className="container relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-secondary to-electric rounded-lg flex items-center justify-center font-heading font-bold text-xl text-white shadow-lg">
                CS
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-foreground">USA Baseball Drills Directory</h3>
                <p className="text-sm text-muted-foreground">Coach Steve Baseball — Player Drill Library</p>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground text-center md:text-right">
              <p>Data sourced from USA Baseball Mobile Coach.</p>
              <p className="mt-1">© {new Date().getFullYear()} All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

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
