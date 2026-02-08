import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, ArrowLeftRight, X, Clock, Activity, BarChart3, Video, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import drillsData from "@/data/drills.json";

interface Drill {
  id: string;
  name: string;
  difficulty: string;
  categories: string[];
  duration: string;
  url: string;
  is_direct_link: boolean;
}

function DrillSelector({
  label,
  selectedDrill,
  onSelect,
  excludeDrillId,
}: {
  label: string;
  selectedDrill: Drill | null;
  onSelect: (drill: Drill) => void;
  excludeDrillId?: string;
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All");

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    drillsData.forEach((d: any) => d.categories.forEach((c: string) => cats.add(c)));
    return ["All", ...Array.from(cats).sort()];
  }, []);

  const filtered = useMemo(() => {
    return (drillsData as Drill[]).filter((d) => {
      if (d.id === excludeDrillId) return false;
      const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = categoryFilter === "All" || d.categories.includes(categoryFilter);
      return matchesSearch && matchesCat;
    });
  }, [search, categoryFilter, excludeDrillId]);

  if (selectedDrill && !isOpen) {
    return (
      <Card className="border-2 border-secondary/30 bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
            <Button variant="ghost" size="sm" onClick={() => { onSelect(null as any); setIsOpen(true); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardTitle className="text-xl font-heading">{selectedDrill.name}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={getDifficultyColor(selectedDrill.difficulty)}>
              {selectedDrill.difficulty}
            </Badge>
            {selectedDrill.categories.map((cat) => (
              <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
            ))}
            {selectedDrill.duration !== "Unknown" && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {selectedDrill.duration}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed border-muted-foreground/30 bg-card/50">
      <CardHeader className="pb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search drills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-0 max-h-[300px] overflow-y-auto">
        <div className="space-y-1">
          {filtered.slice(0, 50).map((drill) => (
            <button
              key={drill.id}
              onClick={() => { onSelect(drill); setIsOpen(false); setSearch(""); }}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-accent transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="font-medium text-sm text-foreground group-hover:text-secondary transition-colors">
                  {drill.name}
                </span>
                <div className="flex gap-1.5 mt-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${getDifficultyColor(drill.difficulty)}`}>
                    {drill.difficulty}
                  </span>
                  {drill.categories.map((cat) => (
                    <span key={cat} className="text-xs text-muted-foreground">{cat}</span>
                  ))}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No drills found</p>
          )}
          {filtered.length > 50 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Showing 50 of {filtered.length} results. Refine your search.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "Easy": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    case "Hard": return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    default: return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
  }
}

function ComparisonRow({ label, icon, valueA, valueB, highlight }: {
  label: string;
  icon?: React.ReactNode;
  valueA: React.ReactNode;
  valueB: React.ReactNode;
  highlight?: boolean;
}) {
  const isDifferent = typeof valueA === "string" && typeof valueB === "string" && valueA !== valueB;
  return (
    <div className={`grid grid-cols-3 gap-4 py-3 px-4 rounded-lg ${highlight ? "bg-accent/50" : ""}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`text-sm text-center ${isDifferent ? "text-secondary font-semibold" : "text-foreground"}`}>
        {valueA}
      </div>
      <div className={`text-sm text-center ${isDifferent ? "text-secondary font-semibold" : "text-foreground"}`}>
        {valueB}
      </div>
    </div>
  );
}

function DrillVideoEmbed({ drillId }: { drillId: string }) {
  const { data: videoData } = trpc.videos.getVideo.useQuery({ drillId });
  
  if (!videoData?.videoUrl) return (
    <div className="flex items-center justify-center h-32 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/20">
      <p className="text-sm text-muted-foreground">No video available</p>
    </div>
  );

  // Extract YouTube video ID
  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const videoId = extractYouTubeId(videoData.videoUrl);
  if (!videoId) return (
    <div className="flex items-center justify-center h-32 bg-muted/30 rounded-lg">
      <a href={videoData.videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-secondary hover:underline flex items-center gap-1">
        <ExternalLink className="h-4 w-4" /> Open Video
      </a>
    </div>
  );

  return (
    <div className="aspect-video rounded-lg overflow-hidden border border-border">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Drill Video"
      />
    </div>
  );
}

function DrillDetailInfo({ drillId }: { drillId: string }) {
  const { data: detail } = trpc.drillDetails.getDrillDetail.useQuery({ drillId });
  const [expanded, setExpanded] = useState(false);

  if (!detail) return (
    <div className="text-sm text-muted-foreground italic py-2">No detailed info available</div>
  );

  return (
    <div className="space-y-3">
      {detail.goal && (
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase">Goal</span>
          <p className="text-sm mt-1">{detail.goal}</p>
        </div>
      )}
      {detail.instructions && (
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase">Instructions</span>
          <p className={`text-sm mt-1 ${!expanded ? "line-clamp-3" : ""}`}>{detail.instructions}</p>
          {detail.instructions.length > 150 && (
            <button onClick={() => setExpanded(!expanded)} className="text-xs text-secondary hover:underline mt-1 flex items-center gap-1">
              {expanded ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Show more</>}
            </button>
          )}
        </div>
      )}
      {detail.equipment && (
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase">Equipment</span>
          <p className="text-sm mt-1">{detail.equipment}</p>
        </div>
      )}
    </div>
  );
}

export default function DrillComparison() {
  const { user } = useAuth();
  const [drillA, setDrillA] = useState<Drill | null>(null);
  const [drillB, setDrillB] = useState<Drill | null>(null);

  const bothSelected = drillA && drillB;

  const swapDrills = () => {
    const temp = drillA;
    setDrillA(drillB);
    setDrillB(temp);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Link href="/coach-dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-heading font-bold text-foreground">Drill Comparison</h1>
              <p className="text-sm text-muted-foreground">Compare two drills side-by-side to find the best fit for your athletes</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Drill Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 relative">
          <DrillSelector
            label="Drill A"
            selectedDrill={drillA}
            onSelect={setDrillA}
            excludeDrillId={drillB?.id}
          />
          
          {/* Swap Button */}
          {bothSelected && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
              <Button
                variant="outline"
                size="icon"
                onClick={swapDrills}
                className="rounded-full h-10 w-10 bg-card border-2 border-secondary/50 hover:border-secondary shadow-lg"
              >
                <ArrowLeftRight className="h-4 w-4 text-secondary" />
              </Button>
            </div>
          )}

          <DrillSelector
            label="Drill B"
            selectedDrill={drillB}
            onSelect={setDrillB}
            excludeDrillId={drillA?.id}
          />
        </div>

        {/* Mobile Swap Button */}
        {bothSelected && (
          <div className="flex justify-center mb-6 md:hidden">
            <Button variant="outline" size="sm" onClick={swapDrills}>
              <ArrowLeftRight className="h-4 w-4 mr-2" /> Swap Drills
            </Button>
          </div>
        )}

        {/* Comparison Table */}
        {bothSelected && (
          <div className="space-y-8">
            {/* Quick Stats Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-secondary" />
                  Quick Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Column Headers */}
                <div className="grid grid-cols-3 gap-4 py-3 px-4 bg-muted/30 border-b border-border">
                  <div className="text-sm font-medium text-muted-foreground">Attribute</div>
                  <div className="text-sm font-bold text-center text-foreground">{drillA.name}</div>
                  <div className="text-sm font-bold text-center text-foreground">{drillB.name}</div>
                </div>

                <div className="divide-y divide-border/50">
                  <ComparisonRow
                    label="Difficulty"
                    icon={<Activity className="h-4 w-4" />}
                    valueA={
                      <Badge variant="outline" className={`${getDifficultyColor(drillA.difficulty)} text-xs`}>
                        {drillA.difficulty}
                      </Badge>
                    }
                    valueB={
                      <Badge variant="outline" className={`${getDifficultyColor(drillB.difficulty)} text-xs`}>
                        {drillB.difficulty}
                      </Badge>
                    }
                    highlight
                  />
                  <ComparisonRow
                    label="Duration"
                    icon={<Clock className="h-4 w-4" />}
                    valueA={drillA.duration}
                    valueB={drillB.duration}
                  />
                  <ComparisonRow
                    label="Categories"
                    valueA={
                      <div className="flex flex-wrap gap-1 justify-center">
                        {drillA.categories.map((c) => (
                          <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    }
                    valueB={
                      <div className="flex flex-wrap gap-1 justify-center">
                        {drillB.categories.map((c) => (
                          <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    }
                    highlight
                  />
                  <ComparisonRow
                    label="Shared Categories"
                    valueA={
                      <span className="text-xs">
                        {drillA.categories.filter((c) => drillB.categories.includes(c)).join(", ") || "None"}
                      </span>
                    }
                    valueB={
                      <span className="text-xs">
                        {drillB.categories.filter((c) => drillA.categories.includes(c)).join(", ") || "None"}
                      </span>
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Video Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Video className="h-5 w-5 text-secondary" />
                  Video Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">{drillA.name}</h3>
                    <DrillVideoEmbed drillId={drillA.id} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">{drillB.name}</h3>
                    <DrillVideoEmbed drillId={drillB.id} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Info Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading">Drill Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-3 pb-2 border-b border-border">{drillA.name}</h3>
                    <DrillDetailInfo drillId={drillA.id} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-3 pb-2 border-b border-border">{drillB.name}</h3>
                    <DrillDetailInfo drillId={drillB.id} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href={`/drill/${drillA.id}`}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" /> View {drillA.name}
                </Button>
              </Link>
              <Link href={`/drill/${drillB.id}`}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" /> View {drillB.name}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => { setDrillA(null); setDrillB(null); }}>
                Compare Different Drills
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!bothSelected && (
          <div className="text-center py-16">
            <div className="bg-muted/30 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowLeftRight className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-heading font-bold mb-2">Select Two Drills to Compare</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Choose a drill from each panel above to see a side-by-side comparison of difficulty, duration, categories, videos, and detailed instructions.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
