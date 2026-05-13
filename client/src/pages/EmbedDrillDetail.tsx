import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Helmet } from "react-helmet-async";
import {
  DrillDetailBody,
  type DrillRow,
} from "@/components/drill/DrillDetailBody";

// ─── Iframe Height Broadcaster ──────────────────────────────────────────────
function useEmbedHeightBroadcast() {
  useEffect(() => {
    function postHeight() {
      const h = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: "csmc:embed-height", height: h }, "*");
    }
    postHeight();
    const ro = new ResizeObserver(() => postHeight());
    ro.observe(document.documentElement);
    const mo = new MutationObserver(() => requestAnimationFrame(postHeight));
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);
}

/**
 * /embed/drill/:id — Rich drill detail for iframe embedding.
 * Uses the shared DrillDetailBody with embed=true to hide admin controls.
 * All navigation stays within /embed/*.
 */
export default function EmbedDrillDetail() {
  useEmbedHeightBroadcast();
  const [match, params] = useRoute("/embed/drill/:id");
  const id = params?.id;

  // ── Data fetching (same pattern as DrillDetail.tsx) ──
  const { data: dbDrill, isLoading: drillLoading } =
    trpc.drillsDirectory.get.useQuery(
      { drillId: id || "" },
      { enabled: !!id }
    );

  const drill: DrillRow | null = dbDrill
    ? {
        id: dbDrill.drillId,
        name: dbDrill.name,
        difficulty: dbDrill.difficulty ?? "Unknown",
        categories: (dbDrill.categories as string[]) ?? [],
        duration: dbDrill.duration ?? "",
        url: dbDrill.url ?? "",
        is_direct_link: dbDrill.isDirectLink,
        problems: ((dbDrill.problems as string[] | null) ?? []),
        outcomes: ((dbDrill.outcomes as string[] | null) ?? []),
      }
    : null;

  const { data: dbDetails } = trpc.drillDetails.getDrillDetail.useQuery(
    { drillId: id || "" },
    { enabled: !!id }
  );

  const details = dbDetails || null;

  const { data: videoData } = trpc.videos.getVideo.useQuery(
    { drillId: id || "" },
    { enabled: !!id }
  );

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
    (details && "videoUrl" in details ? (details as any).videoUrl : null) ||
    null;

  const descriptionSteps = useMemo(() => {
    if (!details || typeof details !== "object") return [];
    const d = details as Record<string, unknown>;
    if (!("description" in d)) return [];
    const desc = d.description;
    return Array.isArray(desc)
      ? desc.filter((x): x is string => typeof x === "string")
      : [];
  }, [details]);

  // ── Loading state ──
  if (drillLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
          <p className="text-slate-400 animate-pulse text-sm">
            Loading drill...
          </p>
        </div>
      </div>
    );
  }

  // ── Not found ──
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
    <div className="min-h-screen bg-background text-white flex flex-col pb-8 w-full max-w-full overflow-x-hidden">
      <Helmet>
        <title>{drill.name} — Coach Steve's Hitters Lab</title>
        <meta
          name="description"
          content={`${drill.difficulty} ${drill.categories.join(", ")} drill. Train your swing with Coach Steve's Hitters Lab.`}
        />
        <meta
          property="og:title"
          content={`${drill.name} — Coach Steve's Hitters Lab`}
        />
        <meta
          property="og:description"
          content={`${drill.difficulty} ${drill.categories.join(", ")} drill.`}
        />
        <meta property="og:image" content={`/api/og/drill/${drill.id}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`https://coachstevemobilecoach.com/embed/drill/${drill.id}`}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`${drill.name} — Coach Steve's Hitters Lab`}
        />
        <meta
          name="twitter:description"
          content={`${drill.difficulty} ${drill.categories.join(", ")} drill.`}
        />
        <meta name="twitter:image" content={`/api/og/drill/${drill.id}`} />
      </Helmet>

      {/* Compact Header */}
      <header className="sticky top-0 z-20 bg-brand-header/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/embed/drills">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white px-2 shrink-0 min-h-[44px] min-w-[44px]"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm sm:text-base font-bold truncate text-white">
                {drill.name}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 border ${
                    drill.difficulty === "Easy"
                      ? "bg-green-500/15 text-green-300 border-green-500/35"
                      : drill.difficulty === "Medium"
                        ? "bg-amber-500/15 text-amber-300 border-amber-500/35"
                        : "bg-red-500/15 text-red-300 border-red-500/35"
                  }`}
                >
                  {drill.difficulty}
                </Badge>
                {drill.categories.map((cat) => (
                  <span key={cat} className="text-[10px] text-white/50">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Body — shared rich layout */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-4 py-6">
        <DrillDetailBody
          drill={drill}
          dbDrill={dbDrill as Record<string, unknown> | null}
          details={details as Record<string, unknown> | null}
          videoUrl={videoUrl}
          pageLayoutBlocks={
            pageLayout?.blocks && Array.isArray(pageLayout.blocks)
              ? (pageLayout.blocks as unknown[])
              : null
          }
          customInstructions={customInstructions}
          user={null}
          embed={true}
          backHref="/embed/drills"
          descriptionSteps={descriptionSteps}
          drillId={id || ""}
        />
      </div>
    </div>
  );
}
