import { AlertTriangle, Eye } from "lucide-react";

type Props = {
  whatToFeel?: string[] | null;     // teal — sensory cues
  coachCue?: string | null;          // yellow — italic quote
  commonMistakes?: string[] | null;  // red
  watchFor?: string | null;          // gray — coaching observation
};

const TEAL = "oklch(70% 0.15 200)";
const YELLOW = "oklch(75% 0.15 80)";
const RED = "oklch(60% 0.2 25)";

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
    <div className="space-y-4">
      {feels.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="text-xs font-semibold tracking-widest mb-3" style={{ color: TEAL }}>
            WHAT TO FEEL
          </h3>
          <ul className="space-y-1.5">
            {feels.map((f, i) => (
              <li key={i} className="flex gap-2 text-sm text-white/85 leading-snug">
                <span
                  className="flex-shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: TEAL }}
                />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {cue && (
        <div
          className="rounded-xl border-l-4 border-white/10 bg-white/[0.02] p-5"
          style={{ borderLeftColor: YELLOW }}
        >
          <h3 className="text-xs font-semibold tracking-widest mb-2" style={{ color: YELLOW }}>
            COACH CUE
          </h3>
          <p className="text-base italic leading-relaxed text-white/90">“{cue}”</p>
        </div>
      )}

      {mistakes.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="text-xs font-semibold tracking-widest mb-3" style={{ color: RED }}>
            COMMON MISTAKES
          </h3>
          <ul className="space-y-2">
            {mistakes.map((m, i) => (
              <li key={i} className="flex gap-2 text-sm text-white/85 leading-snug">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: RED }} />
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {watch && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="text-xs font-semibold tracking-widest mb-2 text-white/55 flex items-center gap-2">
            <Eye className="h-3.5 w-3.5" />
            WATCH FOR
          </h3>
          <p className="text-sm leading-relaxed text-white/85">{watch}</p>
        </div>
      )}
    </div>
  );
}
