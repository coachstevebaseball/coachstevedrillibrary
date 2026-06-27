import { AlertTriangle, Eye } from "lucide-react";
import { SectionLabel } from "@/components/ui/SectionLabel";

type Props = {
  whatToFeel?: string[] | null;     // teal — sensory cues
  coachCue?: string | null;          // yellow — italic quote
  commonMistakes?: string[] | null;  // red
  watchFor?: string | null;          // gray — coaching observation
};

const TEAL = "oklch(76% 0.20 200)";
const YELLOW = "oklch(82% 0.19 80)";
const RED = "oklch(68% 0.26 25)";

function nonEmpty(s?: string | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

function arr(values?: string[] | null): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((v) => (v ?? "").trim()).filter((v) => v.length > 0);
}

export function CoachingLayer({ whatToFeel, coachCue, commonMistakes, watchFor }: Props) {
  const feels = arr(whatToFeel);
  const mistakes = arr(commonMistakes);
  const cue = nonEmpty(coachCue) ? coachCue!.trim() : null;
  const watch = nonEmpty(watchFor) ? watchFor!.trim() : null;

  // Hide the whole section if nothing has been authored yet.
  if (feels.length === 0 && !cue && mistakes.length === 0 && !watch) return null;

  return (
    <div className="w-full max-w-full min-w-0 space-y-4">
      {feels.length > 0 && (
        <div className="w-full max-w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 overflow-hidden">
          <div className="mb-3">
            <SectionLabel
              variant="strong"
              label="WHAT TO FEEL"
              color={TEAL}
            />
          </div>
          <ul className="space-y-1.5">
            {feels.map((f, i) => (
              <li key={i} className="flex gap-2 text-sm text-white leading-snug">
                <span
                  className="flex-shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: TEAL }}
                />
                <span className="flex-1 min-w-0 break-words">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {cue && (
        <div
          className="w-full max-w-full min-w-0 rounded-xl border-l-4 border-white/10 bg-white/[0.02] p-4 sm:p-5 overflow-hidden"
          style={{ borderLeftColor: YELLOW }}
        >
          <div className="mb-2">
            <SectionLabel
              variant="strong"
              label="COACH CUE"
              color={YELLOW}
            />
          </div>
          <p className="text-base italic leading-relaxed text-white break-words">“{cue}”</p>
        </div>
      )}

      {mistakes.length > 0 && (
        <div className="w-full max-w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 overflow-hidden">
          <div className="mb-3">
            <SectionLabel
              variant="strong"
              label="COMMON MISTAKES"
              icon={AlertTriangle}
              color={RED}
            />
          </div>
          <ul className="space-y-2">
            {mistakes.map((m, i) => (
              <li key={i} className="flex gap-2 text-sm text-white leading-snug">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: RED }} />
                <span className="flex-1 min-w-0 break-words">{m}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {watch && (
        <div className="w-full max-w-full min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 overflow-hidden">
          <div className="mb-2">
            <SectionLabel
              variant="strong"
              label="WATCH FOR"
              icon={Eye}
              color="oklch(72% 0.08 0)"
            />
          </div>
          <p className="text-sm leading-relaxed text-white break-words">{watch}</p>
        </div>
      )}
    </div>
  );
}
