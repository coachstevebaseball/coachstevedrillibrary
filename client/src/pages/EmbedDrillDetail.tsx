import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Users, Dumbbell, Target, ExternalLink, Lightbulb, ChevronDown } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useState, useMemo, useEffect } from "react";
import drillsData from "@/data/drills.json";
import { VideoPlayer } from "@/components/VideoPlayer";
import { trpc } from "@/lib/trpc";
import { CustomDrillLayout } from "@/components/CustomDrillLayout";

// Collapsible section for embed view
function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors font-semibold text-left text-sm"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-secondary" />
          {title}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-3 bg-background border-t text-sm">
          {children}
        </div>
      )}
    </div>
  );
}

// Import the same drillDetails record from DrillDetail
// We re-import the static data here; the DB data is fetched via tRPC
import drillDetailsStatic from "@/data/drills.json";

export default function EmbedDrillDetail() {
  const [match, params] = useRoute("/embed/drill/:id");
  const id = params?.id;

  // Fetch custom drills from database
  const { data: customDrills = [] } = trpc.drillDetails.getCustomDrills.useQuery();

  // Look for drill in static data first, then in custom drills
  const staticDrill = drillsData.find(d => d.id.toString() === id);
  const customDrill = customDrills.find((cd: any) => cd.drillId === id);

  // Create a unified drill object
  const drill = staticDrill || (customDrill ? {
    id: customDrill.drillId,
    name: customDrill.name,
    difficulty: customDrill.difficulty,
    categories: [customDrill.category],
    duration: customDrill.duration,
    url: `/drill/${customDrill.drillId}`,
    is_direct_link: true,
  } : null);

  // Fetch drill details from DB
  const { data: dbDetails } = trpc.drillDetails.getDrillDetail.useQuery(
    { drillId: id || '' },
    { enabled: !!id }
  );

  const details = dbDetails || null;

  const [savedVideos, setSavedVideos] = useState<Record<string, string>>({});
  const [customInstructions, setCustomInstructions] = useState('');

  // Load video from database
  const { data: videoData } = trpc.videos.getVideo.useQuery(
    { drillId: id || '' },
    { enabled: !!id }
  );

  // Load instructions from database
  const { data: drillDetailData } = trpc.drillDetails.getDrillDetail.useQuery(
    { drillId: id || '' },
    { enabled: !!id }
  );

  // Load custom page layout
  const { data: pageLayout } = trpc.drillDetails.getPageLayout.useQuery(
    { drillId: id || '' },
    { enabled: !!id }
  );

  useEffect(() => {
    if (videoData) {
      setSavedVideos({ [videoData.drillId]: videoData.videoUrl });
    }
  }, [videoData]);

  useEffect(() => {
    if (drillDetailData?.instructions) {
      setCustomInstructions(drillDetailData.instructions);
    }
  }, [drillDetailData]);

  // Loading state
  if (!drill) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading drill...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-4">
      {/* Compact Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.25_0.05_250)] via-[oklch(0.20_0.04_260)] to-[oklch(0.15_0.06_280)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.45_0.15_250/0.15),transparent_60%)]" />
        <div className="relative z-10 px-4 py-4">
          <Link href="/embed">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 mb-3 pl-0 gap-1.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Drills
            </Button>
          </Link>
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <Badge className={`font-bold text-[10px] px-2 py-0.5 ${
              drill.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
              drill.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
              'bg-red-500/20 text-red-400 border-red-500/30'
            }`} variant="outline">
              {drill.difficulty}
            </Badge>
            {drill.categories.map(cat => (
              <Badge key={cat} variant="outline" className="bg-white/[0.06] text-white/80 border-white/[0.12] font-medium text-[10px]">
                {cat}
              </Badge>
            ))}
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white leading-tight tracking-tight">{drill.name}</h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 max-w-4xl mx-auto mt-4">
        {/* Check if custom page layout exists */}
        {pageLayout?.blocks && Array.isArray(pageLayout.blocks) && pageLayout.blocks.length > 0 ? (
          <div className="grid gap-4">
            <CustomDrillLayout blocks={pageLayout.blocks as any[]} />
          </div>
        ) : details ? (
          <div className="grid gap-4">
            {/* Video Section */}
            {(savedVideos[drill.id] || (details && 'videoUrl' in details && details.videoUrl)) ? (
              <VideoPlayer videoUrl={(savedVideos[drill.id] || (details && 'videoUrl' in details && details.videoUrl)) as string} title={`${drill.name} Video`} />
            ) : (
              <div className="bg-muted rounded-lg aspect-video flex items-center justify-center border-2 border-dashed border-muted-foreground/20 w-full">
                <div className="text-center p-3">
                  <p className="text-muted-foreground font-medium text-sm">Video / Diagram Placeholder</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Media content would appear here</p>
                </div>
              </div>
            )}

            {/* Goal */}
            <div className="rounded-lg border-l-4 border-l-blue-500 bg-card border p-4">
              <h3 className="flex items-center gap-2 text-base font-bold mb-2">
                <Lightbulb className="h-4 w-4 text-blue-400" />
                Goal of Drill
              </h3>
              <p className="text-sm text-foreground/90 leading-relaxed">{details.goal}</p>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-card border rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-3 w-3 text-blue-400" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Time</span>
                </div>
                <div className="font-bold text-foreground text-xs">{details.time}</div>
              </div>
              <div className="bg-card border rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="h-3 w-3 text-purple-400" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Athletes</span>
                </div>
                <div className="font-bold text-foreground text-[11px]">{details.athletes.split(',')[0]}</div>
              </div>
              <div className="bg-card border rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Dumbbell className="h-3 w-3 text-amber-400" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Equipment</span>
                </div>
                <div className="font-bold text-foreground text-[11px]">{details.equipment.split(',')[0]}</div>
              </div>
              <div className="bg-card border rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target className="h-3 w-3 text-green-400" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Skill Set</span>
                </div>
                <div className="font-bold text-foreground text-[11px]">{details.skillSet}</div>
              </div>
            </div>

            {/* Instructions */}
            <section>
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-green-400" />
                Instructions
              </h2>
              <div className="bg-card border rounded-lg p-4">
                <div className="prose prose-sm max-w-none">
                  {customInstructions ? (
                    <div className="whitespace-pre-wrap text-foreground text-sm leading-relaxed">
                      {customInstructions}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic text-sm">No instructions provided for this drill yet.</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed">
            <h3 className="text-base font-bold mb-1">Content Not Available</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Detailed content for this drill hasn't been added yet.
            </p>
            {drill.url && (
              <a href={drill.url} target="_blank" rel="noopener noreferrer">
                <Button size="sm">
                  View on USA Baseball <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Minimal branding footer */}
      <div className="px-4 py-3 mt-6 text-center border-t">
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
