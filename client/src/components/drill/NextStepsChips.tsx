import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

const TEAL = "oklch(70% 0.15 200)";

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
    <div>
      <h3
        className="text-xs font-semibold tracking-widest mb-3"
        style={{ color: TEAL }}
      >
        NEXT STEPS — BUILD ON THIS DRILL
      </h3>
      <div className="flex gap-2 overflow-x-auto md:flex-wrap pb-1 -mx-1 px-1">
        {drills.map((d) => (
          <Link key={d.drillId} href={`/drill/${d.drillId}`}>
            <a
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border border-white/15 bg-white/[0.04] text-white/85 hover:text-white hover:bg-white/[0.08] hover:border-white/25 transition-colors whitespace-nowrap min-h-[44px] md:min-h-0"
            >
              <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{d.name}</span>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
