import { Link } from "wouter";
import { CheckCircle, Loader2, Upload } from "lucide-react";

type Props = {
  drillId: string;
  assignmentId?: number | null;
  onMarkComplete?: () => void;
  isCompleting?: boolean;
};

/**
 * Fixed-bottom CTA bar for athletes on mobile (< md). Hidden on desktop
 * and for admin / coach users — those are gated by the caller, not here.
 *
 * - Mark Complete: shown only when this drill is an active assignment
 *   for the viewer (assignmentId truthy). Calls back into the page so
 *   the page owns the mutation.
 * - Upload My Swing: always shown. Deep-links to the Swing Analyzer
 *   inside the athlete portal with this drillId pre-tagged.
 */
export function StickyMobileCTA({ drillId, assignmentId, onMarkComplete, isCompleting }: Props) {
  const canMarkComplete = Boolean(assignmentId);

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-[rgb(8,8,9)]/95 backdrop-blur-md pt-2 pb-3 px-3 flex gap-2 safe-area-bottom">
      {canMarkComplete && (
        <button
          type="button"
          onClick={onMarkComplete}
          disabled={isCompleting}
          className="flex-1 h-12 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
          style={{
            background:
              "linear-gradient(135deg, oklch(60% 0.2 25) 0%, oklch(50% 0.2 25) 100%)",
          }}
        >
          {isCompleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Mark Complete
            </>
          )}
        </button>
      )}

      <Link href={`/athlete-portal?drillId=${encodeURIComponent(drillId)}#swing-analyzer`}>
        <a
          className={`${
            canMarkComplete ? "flex-1" : "w-full"
          } h-12 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-opacity`}
          style={{
            background:
              "linear-gradient(135deg, oklch(60% 0.22 300) 0%, oklch(65% 0.2 340) 100%)",
          }}
        >
          <Upload className="h-4 w-4" />
          Upload My Swing
        </a>
      </Link>
    </div>
  );
}
