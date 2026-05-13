import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ExternalLink,
  Edit,
  Trash2,
  Layout,
  Target,
} from "lucide-react";
import { Link } from "wouter";
import { VideoPlayer } from "@/components/VideoPlayer";
import { TiptapEditor, TiptapRenderer } from "@/components/TiptapEditor";
import { EditableStatBar } from "@/components/EditableStatBar";
import { CustomDrillLayout } from "@/components/CustomDrillLayout";
import { DrillQAForm } from "@/components/DrillQAForm";
import { DrillPageBuilderNotion } from "@/components/DrillPageBuilderNotion";
import { EditDrillDetailsModal } from "@/components/EditDrillDetailsModal";
import { InlineEdit } from "@/components/InlineEdit";
import { QuickInfoGrid } from "@/components/drill/QuickInfoGrid";
import { CoachingLayer } from "@/components/drill/CoachingLayer";
import { NextStepsChips } from "@/components/drill/NextStepsChips";
import { MetadataFooter } from "@/components/drill/MetadataFooter";
import {
  RelatedDrillsCarousel,
  type RelatedDrill,
} from "@/components/drill/RelatedDrillsCarousel";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { trpc } from "@/lib/trpc";
import { useAllDrills } from "@/hooks/useAllDrills";
import { toast } from "sonner";

// ─── DrillTagSection ────────────────────────────────────────────────────────
const MAX_VISIBLE_TAGS = 4;

function DrillTagSection({
  problems,
  outcomes,
}: {
  problems: string[];
  outcomes: string[];
}) {
  const [showAll, setShowAll] = useState(false);
  const allTags: Array<{ label: string; type: "problem" | "outcome" }> = [
    ...problems.map((p) => ({ label: p, type: "problem" as const })),
    ...outcomes.map((o) => ({ label: o, type: "outcome" as const })),
  ];
  if (allTags.length === 0) return null;
  const visibleTags = showAll ? allTags : allTags.slice(0, MAX_VISIBLE_TAGS);
  const hasMore = allTags.length > MAX_VISIBLE_TAGS;
  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden">
      <SectionLabel variant="quiet" label="What this drill fixes & improves" />
      <div className="flex flex-wrap gap-2 w-full max-w-full min-w-0">
        {visibleTags.map((tag, i) => (
          <span
            key={i}
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border max-w-full break-words ${
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
            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.07] text-white/60 border border-white/[0.15] hover:bg-white/[0.12] transition-colors min-h-[44px]"
          >
            {showAll
              ? "Show Less"
              : `+${allTags.length - MAX_VISIBLE_TAGS} More`}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Types ──────────────────────────────────────────────────────────────────

/** Mapped drill row — same shape both DrillDetail and EmbedDrillDetail build. */
export type DrillRow = {
  id: string;
  name: string;
  difficulty: string;
  categories: string[];
  duration: string;
  url: string;
  is_direct_link: boolean;
  problems: string[];
  outcomes: string[];
};

export type DrillDetailBodyProps = {
  /** The mapped drill row. */
  drill: DrillRow;
  /** Raw DB row — used for rich fields (goalOfDrill, coachSteveCue, etc.). */
  dbDrill: Record<string, unknown> | null;
  /** Drill details (from drillDetails table or hardcoded fallback). */
  details: Record<string, unknown> | null;
  /** Video URL resolved from DB or details. */
  videoUrl: string | null;
  /** Custom page layout blocks (from drillDetails.getPageLayout). */
  pageLayoutBlocks: unknown[] | null;
  /** Custom instructions (Tiptap HTML). */
  customInstructions: string;
  /** Current user (null if anonymous). */
  user: { id: string | number; role: string } | null;
  /** When true, hides admin controls, floating widgets, and uses /embed/ link prefix. */
  embed?: boolean;
  /** Back link href. */
  backHref: string;
  /** Description steps extracted from details.description. */
  descriptionSteps: string[];
  /** Drill slug / id. */
  drillId: string;
  // ── Admin callbacks (only used when embed=false) ──
  onShowPageBuilder?: () => void;
  onEditModalOpen?: () => void;
  onShowDeleteConfirm?: () => void;
  // ── Instructions editing (only used when embed=false) ──
  onInstructionsChange?: (v: string) => void;
  onInstructionsSave?: () => void;
  isInstructionsSaving?: boolean;
};

// ─── Component ──────────────────────────────────────────────────────────────

export function DrillDetailBody({
  drill,
  dbDrill,
  details,
  videoUrl,
  pageLayoutBlocks,
  customInstructions,
  user,
  embed = false,
  backHref,
  descriptionSteps,
  drillId,
  onShowPageBuilder,
  onEditModalOpen,
  onShowDeleteConfirm,
  onInstructionsChange,
  onInstructionsSave,
  isInstructionsSaving,
}: DrillDetailBodyProps) {
  const isAdmin = !embed && user?.role === "admin";
  const isAthlete = user?.role === "athlete";
  const linkPrefix = embed ? "/embed/drill/" : "/drill/";

  // ── Related drills ──
  const allDrills = useAllDrills();
  const relatedDrills = useMemo(() => {
    if (!dbDrill || allDrills.length === 0) return [];
    const curated = ((dbDrill.nextStepDrillIds as string[] | null) ?? []);
    if (curated.length > 0) {
      return curated
        .map((slug) => allDrills.find((d) => d.id === slug))
        .filter((d): d is NonNullable<typeof d> => !!d)
        .slice(0, 6);
    }
    const myTags = new Set<string>([
      ...((dbDrill.tags as string[] | null) ?? []),
      ...((dbDrill.outcomes as string[] | null) ?? []),
      ...((dbDrill.problems as string[] | null) ?? []),
    ]);
    if (myTags.size === 0) return [];
    return allDrills
      .filter((d) => d.id !== (dbDrill.drillId as string))
      .map((d) => {
        const theirTags = new Set<string>([
          ...(d.tags ?? []),
          ...(d.outcomes ?? []),
          ...(d.problems ?? []),
        ]);
        let overlap = 0;
        myTags.forEach((t) => {
          if (theirTags.has(t)) overlap++;
        });
        return { drill: d, overlap };
      })
      .filter((x) => x.overlap >= 2)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 6)
      .map((x) => x.drill);
  }, [dbDrill, allDrills]);

  // ── Render: custom page layout ──
  if (
    pageLayoutBlocks &&
    Array.isArray(pageLayoutBlocks) &&
    pageLayoutBlocks.length > 0
  ) {
    return (
      <div className="grid gap-6 md:gap-8">
        {isAdmin && (
          <div className="flex gap-2 justify-end">
            <button
              onClick={onShowPageBuilder}
              className="flex items-center gap-1 px-3 py-2 rounded-md bg-electric/10 hover:bg-electric/20 text-electric transition-colors text-sm font-medium"
            >
              <Layout className="h-4 w-4" />
              Edit Page
            </button>
          </div>
        )}
        <CustomDrillLayout blocks={pageLayoutBlocks as any[]} />

        {details && (
          <EditableStatBar
            drillId={drillId}
            isCoach={isAdmin}
            defaultCards={[
              {
                id: `${drillId}-time`,
                label: "Time",
                value: (details as any).time,
                icon: "clock",
              },
              {
                id: `${drillId}-athletes`,
                label: "Athletes",
                value: ((details as any).athletes ?? "").split(",")[0],
                icon: "users",
              },
              {
                id: `${drillId}-equipment`,
                label: "Equipment",
                value: ((details as any).equipment ?? "").split(",")[0],
                icon: "dumbbell",
              },
              {
                id: `${drillId}-skill`,
                label: "Skill Set",
                value: (details as any).skillSet,
                icon: "target",
              },
            ]}
          />
        )}

        {/* Instructions */}
        <section>
          <SectionLabel
            variant="strong"
            label="Instructions"
            icon={Target}
            color="oklch(68% 0.20 150)"
          />
          <div className="glass-card rounded-xl p-4 md:p-6">
            {isAdmin && onInstructionsChange ? (
              <TiptapEditor
                value={customInstructions}
                onChange={onInstructionsChange}
                onSave={onInstructionsSave}
                isSaving={isInstructionsSaving}
                placeholder="Write drill instructions here..."
              />
            ) : (
              <div className="min-h-[60px]">
                {customInstructions ? (
                  <TiptapRenderer content={customInstructions} />
                ) : (
                  <p className="text-muted-foreground italic">
                    No instructions provided for this drill yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Q&A for athletes */}
        {isAthlete && !embed && (
          <DrillQAForm drillId={drillId} drillName={drill.name} />
        )}
      </div>
    );
  }

  // ── Render: standard rich layout ──
  if (details) {
    return (
      <div className="grid gap-8 md:gap-12 w-full min-w-0 overflow-hidden">
        {/* Video */}
        {videoUrl ? (
          <VideoPlayer videoUrl={videoUrl} title={`${drill.name} Video`} />
        ) : (
          <div className="bg-muted rounded-lg md:rounded-xl aspect-video flex items-center justify-center border-2 border-dashed border-muted-foreground/20 w-full">
            <div className="text-center p-3 md:p-4">
              <p className="text-muted-foreground font-medium text-sm md:text-base">
                Video / Diagram Placeholder
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Media content would appear here
              </p>
            </div>
          </div>
        )}

        {/* Tags — Problems + Outcomes */}
        {((drill.problems?.length ?? 0) > 0 ||
          (drill.outcomes?.length ?? 0) > 0) && (
          <DrillTagSection
            problems={drill.problems ?? []}
            outcomes={drill.outcomes ?? []}
          />
        )}

        {/* Admin toolbar */}
        {isAdmin && (
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={onShowPageBuilder}
              className="flex items-center gap-1 px-3 py-2 rounded-md bg-electric/10 hover:bg-electric/20 text-electric transition-colors text-sm font-medium"
            >
              <Layout className="h-4 w-4" />
              Page Builder
            </button>
            <button
              onClick={onEditModalOpen}
              className="flex items-center gap-1 px-3 py-2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-sm font-medium"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={onShowDeleteConfirm}
              className="flex items-center gap-1 px-3 py-2 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors text-sm font-medium"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}

        {/* Quick Info grid: Goal / Problem It Solves / Equipment / How To Do It */}
        <QuickInfoGrid
          goal={
            ((dbDrill?.goalOfDrill as string | null) ??
              (details as any)?.goal) || null
          }
          problemsSolved={
            (dbDrill?.whatThisDrillHelpsFix as string[] | null) ?? null
          }
          equipment={
            (dbDrill?.equipment as string[] | null) ??
            (typeof (details as any)?.equipment === "string"
              ? (details as any).equipment
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean)
              : null)
          }
          howToSteps={
            (dbDrill?.howToRunTheDrill as string[] | null) ??
            (descriptionSteps.length > 0 ? descriptionSteps : null)
          }
        />

        {/* Coaching Layer */}
        <CoachingLayer
          whatToFeel={(dbDrill?.coachingNotes as string[] | null) ?? null}
          coachCue={(dbDrill?.coachSteveCue as string | null) ?? null}
          commonMistakes={
            (dbDrill?.commonMistakes as string[] | null) ?? null
          }
          watchFor={
            (dbDrill?.gameTransferExplanation as string | null) ??
            (dbDrill?.whoThisDrillIsBestFor as string | null) ??
            null
          }
        />

        {/* Next Steps chips */}
        <NextStepsChips
          drills={relatedDrills
            .slice(0, 4)
            .map((d) => ({ drillId: d.id, name: d.name }))}
          basePath={linkPrefix}
        />

        {/* Metadata footer: Drill Type / Age Level / Focus Areas */}
        <MetadataFooter
          drillType={(dbDrill?.drillType as string | null) ?? null}
          ageLevels={(dbDrill?.ageLevel as string[] | null) ?? null}
          focusAreas={
            (dbDrill?.tags as string[] | null) ??
            (dbDrill?.outcomes as string[] | null) ??
            null
          }
        />

        {/* Related Drills carousel */}
        <RelatedDrillsCarousel
          drills={relatedDrills.slice(0, 3).map<RelatedDrill>((d) => ({
            drillId: d.id,
            name: d.name,
            difficulty: d.difficulty,
            category: d.categories?.[0] ?? null,
            duration: d.duration,
            featured: Boolean(d.featured),
          }))}
          basePath={linkPrefix}
        />

        {/* Q&A for athletes */}
        {isAthlete && !embed && (
          <DrillQAForm drillId={drillId} drillName={drill.name} />
        )}
      </div>
    );
  }

  // ── Render: no details fallback ──
  return (
    <div className="grid gap-5">
      {/* Still show video if available */}
      {videoUrl && (
        <VideoPlayer videoUrl={videoUrl} title={`${drill.name} Video`} />
      )}

      {/* Tags */}
      {((drill.problems?.length ?? 0) > 0 ||
        (drill.outcomes?.length ?? 0) > 0) && (
        <DrillTagSection
          problems={drill.problems ?? []}
          outcomes={drill.outcomes ?? []}
        />
      )}

      {!videoUrl && (
        <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
          <h3 className="text-xl font-bold mb-2">Content Not Available</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            We haven't extracted the detailed content for this drill yet.
            {drill.url && " You can view it on the official website."}
          </p>
          {drill.url && (
            <a href={drill.url} target="_blank" rel="noopener noreferrer">
              <Button>
                View on USA Baseball{" "}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
