import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, ExternalLink, Lightbulb } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useState, useEffect } from "react";
// drillsData import removed — drill lookup now uses unified DB
import { VideoPlayer } from "@/components/VideoPlayer";
import { TiptapRenderer } from "@/components/TiptapEditor";
import { CustomDrillLayout } from "@/components/CustomDrillLayout";
import { trpc } from "@/lib/trpc";
import { Helmet } from "react-helmet-async";

/**
 * /embed/drill/:id — Streamlined drill detail for iframe embedding.
 * Read-only. No admin controls, no edit buttons, no modals.
 * All navigation stays within /embed/*.
 * Layout matches non-embed DrillDetail: Video → Tags → Goal of Drill → Instructions
 */

const MAX_VISIBLE_TAGS = 4;

function DrillTagSection({ problems, outcomes }: { problems: string[]; outcomes: string[] }) {
  const [showAll, setShowAll] = useState(false);
  const allTags: Array<{ label: string; type: "problem" | "outcome" }> = [
    ...problems.map((p) => ({ label: p, type: "problem" as const })),
    ...outcomes.map((o) => ({ label: o, type: "outcome" as const })),
  ];
  if (allTags.length === 0) return null;
  const visibleTags = showAll ? allTags : allTags.slice(0, MAX_VISIBLE_TAGS);
  const hasMore = allTags.length > MAX_VISIBLE_TAGS;
  return (
    <div className="px-1">
      <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
        What this drill fixes &amp; improves
      </p>
      <div className="flex flex-wrap gap-2">
        {visibleTags.map((tag, i) => (
          <span
            key={i}
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border ${
              tag.type === "problem"
                ? "bg-red-500/15 text-red-300 border-red-500/30"
                : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
            }`}
          >
            {tag.label}
          </span>
        ))}
        {hasMore && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.07] text-white/60 border border-white/[0.15] hover:bg-white/[0.12] transition-colors"
          >
            {showAll ? "Show Less" : `+${allTags.length - MAX_VISIBLE_TAGS} More`}
          </button>
        )}
      </div>
    </div>
  );
}

export default function EmbedDrillDetail() {
  const [match, params] = useRoute("/embed/drill/:id");
  const id = params?.id;

  // Load drill from unified DB table by slug
  const { data: dbDrill, isLoading: drillLoading } = trpc.drillsDirectory.get.useQuery(
    { drillId: id || '' },
    { enabled: !!id }
  );

  // Map DB row to the shape the component expects
  const drill = dbDrill ? {
    id: dbDrill.drillId,
    name: dbDrill.name,
    difficulty: dbDrill.difficulty ?? 'Unknown',
    categories: (dbDrill.categories as string[]) ?? [],
    duration: dbDrill.duration ?? '',
    url: dbDrill.url ?? '',
    is_direct_link: dbDrill.isDirectLink,
    problems: (dbDrill.problems as string[] | null) ?? [],
    outcomes: (dbDrill.outcomes as string[] | null) ?? [],
  } : null;

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

  const videoUrl =
    videoData?.videoUrl ||
    (details && "videoUrl" in details ? (details as any).videoUrl : null);

  // Loading
  if (drillLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
          <p className="text-slate-400 animate-pulse text-sm">Loading drill...</p>
        </div>
      </div>
    );
  }

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

  // Problems + outcomes from DB drill data
  const problems = drill?.problems ?? [];
  const outcomes = drill?.outcomes ?? [];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Helmet>
        <title>{drill.name} — Coach Steve's Hitters Lab</title>
        <meta name="description" content={`${drill.difficulty} ${drill.categories.join(', ')} drill. Train your swing with Coach Steve's Hitters Lab.`} />
        <meta property="og:title" content={`${drill.name} — Coach Steve's Hitters Lab`} />
        <meta property="og:description" content={`${drill.difficulty} ${drill.categories.join(', ')} drill. Train your swing with Coach Steve's Hitters Lab.`} />
        <meta property="og:image" content={`/api/og/drill/${drill.id}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://coachstevemobilecoach.com/embed/drill/${drill.id}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${drill.name} — Coach Steve's Hitters Lab`} />
        <meta name="twitter:description" content={`${drill.difficulty} ${drill.categories.join(', ')} drill. Train your swing with Coach Steve's Hitters Lab.`} />
        <meta name="twitter:image" content={`/api/og/drill/${drill.id}`} />
      </Helmet>
      {/* Compact Header */}
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-3 py-3">
          <div className="flex items-center gap-3">
            <Link href="/embed/drills">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white px-2 shrink-0"
              >
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
        {pageLayout?.blocks &&
        Array.isArray(pageLayout.blocks) &&
        pageLayout.blocks.length > 0 ? (
          <div className="grid gap-5">
            <CustomDrillLayout blocks={pageLayout.blocks as any[]} />

            {/* Tags — always shown after custom layout too */}
            {(problems.length > 0 || outcomes.length > 0) && (
              <DrillTagSection problems={problems} outcomes={outcomes} />
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
            {/* 1. Video */}
            {videoUrl ? (
              <VideoPlayer videoUrl={videoUrl} title={`${drill.name} Video`} />
            ) : (
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg aspect-video flex items-center justify-center">
                <div className="text-center p-4">
                  <p className="text-slate-500 text-sm">Video not available</p>
                </div>
              </div>
            )}

            {/* 2. Tags — What this drill fixes & improves */}
            {(problems.length > 0 || outcomes.length > 0) && (
              <DrillTagSection problems={problems} outcomes={outcomes} />
            )}

            {/* 3. Goal of Drill */}
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg border-l-4 border-l-red-600 p-4">
              <h3 className="flex items-center gap-2 text-base font-bold mb-2">
                <Lightbulb className="h-4 w-4 text-red-400" />
                Goal of Drill
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {(details as any).goal}
              </p>
            </div>

            {/* 4. Instructions */}
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
                ) : (details as any).description &&
                  (details as any).description.length > 0 ? (
                  <ol className="space-y-2">
                    {(details as any).description.map(
                      (step: string, idx: number) => (
                        <li
                          key={idx}
                          className="flex gap-3 text-sm text-slate-300"
                        >
                          <span className="shrink-0 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed pt-0.5">{step}</span>
                        </li>
                      )
                    )}
                  </ol>
                ) : (
                  <p className="text-slate-500 italic text-sm">
                    No instructions available.
                  </p>
                )}
              </div>
            </section>
          </div>
        ) : (
          /* No details — show video + tags if available */
          <div className="grid gap-5">
            {videoUrl && (
              <VideoPlayer videoUrl={videoUrl} title={`${drill.name} Video`} />
            )}

            {(problems.length > 0 || outcomes.length > 0) && (
              <DrillTagSection problems={problems} outcomes={outcomes} />
            )}

            {!videoUrl && (
              <div className="text-center py-12">
                <p className="text-slate-400 text-sm mb-4">
                  Detailed content not available for this drill yet.
                </p>
                {drill.url && (
                  <a href={drill.url} target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-xs"
                    >
                      View on USA Baseball{" "}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                )}
              </div>
            )}
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
