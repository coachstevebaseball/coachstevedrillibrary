import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, ExternalLink, Lightbulb } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useState, useEffect } from "react";
import drillsData from "@/data/drills";
import { filterOptions } from "@/data/drills";
import { VideoPlayer } from "@/components/VideoPlayer";
import { TiptapRenderer } from "@/components/TiptapEditor";
import { EditableStatBar } from "@/components/EditableStatBar";
import { CustomDrillLayout } from "@/components/CustomDrillLayout";
import { trpc } from "@/lib/trpc";

/**
 * /embed/drill/:id — Streamlined drill detail for iframe embedding.
 * Read-only. No admin controls, no edit buttons, no modals.
 * All navigation stays within /embed/*.
 */
export default function EmbedDrillDetail() {
  const [match, params] = useRoute("/embed/drill/:id");
  const id = params?.id;

  // Fetch custom drills from database
  const { data: customDrills = [] } = trpc.drillDetails.getCustomDrills.useQuery();

  // Look for drill in static data first, then in custom drills
  const staticDrill = drillsData.find((d) => d.id.toString() === id);
  const customDrill = customDrills.find((cd: any) => cd.drillId === id);

  const drill = staticDrill || (customDrill ? {
    id: customDrill.drillId,
    name: customDrill.name,
    difficulty: customDrill.difficulty,
    categories: [customDrill.category],
    duration: customDrill.duration,
    url: `/drill/${customDrill.drillId}`,
    is_direct_link: true,
  } : null);

  // Load from database
  const { data: dbDetails } = trpc.drillDetails.getDrillDetail.useQuery(
    { drillId: id || "" },
    { enabled: !!id }
  );

  const details = dbDetails || null;

  // Load video from database
  const { data: videoData } = trpc.videos.getVideo.useQuery(
    { drillId: id || "" },
    { enabled: !!id }
  );

  // Load custom page layout
  const { data: pageLayout } = trpc.drillDetails.getPageLayout.useQuery(
    { drillId: id || "" },
    { enabled: !!id }
  );

  const [customInstructions, setCustomInstructions] = useState("");

  useEffect(() => {
    if (dbDetails?.instructions) {
      setCustomInstructions(dbDetails.instructions);
    }
  }, [dbDetails]);

  const videoUrl = videoData?.videoUrl || (details && "videoUrl" in details ? (details as any).videoUrl : null);

  // Not found
  if (!drill) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Drill not found.</p>
          <Link href="/embed/drills">
            <Button variant="outline" size="sm" className="gap-2 text-sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Drills
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Compact Header */}
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-3 py-3">
          <div className="flex items-center gap-3">
            <Link href="/embed/drills">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white px-2 shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm sm:text-base font-bold truncate">{drill.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 border ${
                    drill.difficulty === "Easy"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : drill.difficulty === "Medium"
                      ? "bg-amber-100 text-amber-700 border-amber-200"
                      : "bg-red-100 text-red-700 border-red-200"
                  }`}
                >
                  {drill.difficulty}
                </Badge>
                {drill.categories.map((cat) => (
                  <span key={cat} className="text-[10px] text-slate-500">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-3 py-4">
        {/* Custom page layout takes priority */}
        {pageLayout?.blocks && Array.isArray(pageLayout.blocks) && pageLayout.blocks.length > 0 ? (
          <div className="grid gap-5">
            <CustomDrillLayout blocks={pageLayout.blocks as any[]} />

            {details && (
              <EditableStatBar
                drillId={id || "unknown"}
                isCoach={false}
                defaultCards={[
                  { id: `${id}-time`, label: "Time", value: (details as any).time, icon: "clock" },
                  { id: `${id}-athletes`, label: "Athletes", value: (details as any).athletes?.split(",")[0], icon: "users" },
                  { id: `${id}-equipment`, label: "Equipment", value: (details as any).equipment?.split(",")[0], icon: "dumbbell" },
                  { id: `${id}-skill`, label: "Skill Set", value: (details as any).skillSet, icon: "target" },
                ]}
              />
            )}

            {customInstructions && (
              <section>
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-green-500/20 flex items-center justify-center">
                    <Target className="h-3.5 w-3.5 text-green-400" />
                  </div>
                  Instructions
                </h2>
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-4">
                  <TiptapRenderer content={customInstructions} />
                </div>
              </section>
            )}
          </div>
        ) : details ? (
          <div className="grid gap-5">
            {/* Video */}
            {videoUrl ? (
              <VideoPlayer videoUrl={videoUrl} title={`${drill.name} Video`} />
            ) : (
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg aspect-video flex items-center justify-center">
                <div className="text-center p-4">
                  <p className="text-slate-500 text-sm">Video not available</p>
                </div>
              </div>
            )}

            {/* Goal */}
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg border-l-4 border-l-red-600 p-4">
              <h3 className="flex items-center gap-2 text-base font-bold mb-2">
                <Lightbulb className="h-4 w-4 text-red-400" />
                Goal of Drill
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">{(details as any).goal}</p>
            </div>

            {/* Stat Cards */}
            <EditableStatBar
              drillId={id || "unknown"}
              isCoach={false}
              defaultCards={[
                { id: `${id}-time`, label: "Time", value: (details as any).time, icon: "clock" },
                { id: `${id}-athletes`, label: "Athletes", value: (details as any).athletes?.split(",")[0], icon: "users" },
                { id: `${id}-equipment`, label: "Equipment", value: (details as any).equipment?.split(",")[0], icon: "dumbbell" },
                { id: `${id}-skill`, label: "Skill Set", value: (details as any).skillSet, icon: "target" },
              ]}
            />

            {/* Instructions */}
            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-green-500/20 flex items-center justify-center">
                  <Target className="h-3.5 w-3.5 text-green-400" />
                </div>
                Instructions
              </h2>
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-4">
                {customInstructions ? (
                  <TiptapRenderer content={customInstructions} />
                ) : (details as any).description && (details as any).description.length > 0 ? (
                  <ol className="space-y-2">
                    {(details as any).description.map((step: string, idx: number) => (
                      <li key={idx} className="flex gap-3 text-sm text-slate-300">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-slate-500 italic text-sm">No instructions available.</p>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm mb-4">
              Detailed content not available for this drill yet.
            </p>
            {drill.url && (
              <a href={drill.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  View on USA Baseball <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            )}
          </div>
        )}

        {/* Metadata Tags (for static drills) */}
        {staticDrill && (staticDrill.drillType || (staticDrill.ageLevel?.length ?? 0) > 0 || (staticDrill.tags?.length ?? 0) > 0 || (staticDrill.problem?.length ?? 0) > 0 || (staticDrill.goal?.length ?? 0) > 0) && (
          <div className="grid gap-3 mt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {staticDrill.drillType && (
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Drill Type</div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {staticDrill.drillType}
                  </span>
                </div>
              )}
              {(staticDrill.ageLevel?.length ?? 0) > 0 && (
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Age / Level</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(staticDrill.ageLevel ?? []).filter((v: string) => v !== "all").map((level: string) => {
                      const label = filterOptions.ageLevel.find((o) => o.value === level)?.label ?? level;
                      return (
                        <span key={level} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {(staticDrill.tags?.length ?? 0) > 0 && (
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Focus Areas</div>
                <div className="flex flex-wrap gap-1.5">
                  {(staticDrill.tags ?? []).map((tag: string) => (
                    <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-slate-400 border border-white/[0.12]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(staticDrill.problem?.length ?? 0) > 0 && (
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Fixes These Problems</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(staticDrill.problem ?? []).map((p: string) => {
                      const label = filterOptions.problem.find((o) => o.value === p)?.label ?? p;
                      return (
                        <span key={p} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/15 text-red-300 border border-red-500/25">
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {(staticDrill.goal?.length ?? 0) > 0 && (
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Helps You</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(staticDrill.goal ?? []).map((g: string) => {
                      const label = filterOptions.goal.find((o) => o.value === g)?.label ?? g;
                      return (
                        <span key={g} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/15 text-green-300 border border-green-500/25">
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Minimal Footer */}
      <div className="text-center py-2 px-3 mt-auto">
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
