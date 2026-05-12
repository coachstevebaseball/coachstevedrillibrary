import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

const TEAL = "oklch(76% 0.20 200)";

type NextDrill = {
  drillId: string;
  name: string;
};

type Props = {
  drills: NextDrill[];
};

export function NextStepsChips({ drills }: Props) {
  if (!drills || drills.length === 0) return null;

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden">
      <h3
        className="text-xs font-bold tracking-widest mb-3"
        style={{ color: TEAL }}
      >
        NEXT STEPS — BUILD ON THIS DRILL
      </h3>
      {/* Scrollable row is inside the overflow-hidden parent so it cannot push the page wider */}
      <div className="w-full overflow-x-auto overflow-y-hidden md:overflow-visible -mx-1 px-1">
        <div className="flex gap-2 md:flex-wrap pb-2 w-max md:w-auto">
          {drills.map((d) => (
            <Link key={d.drillId} href={`/drill/${d.drillId}`}>
              <a
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border bg-white/[0.04] text-white hover:bg-white/[0.10] transition-colors whitespace-nowrap min-h-[44px] md:min-h-0"
                style={{ borderColor: "oklch(76% 0.20 200 / 0.4)" }}
              >
                <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" style={{ color: TEAL }} />
                <span>{d.name}</span>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
