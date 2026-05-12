import { Link } from "wouter";
import { Clock, Star } from "lucide-react";

export type RelatedDrill = {
  drillId: string;
  name: string;
  difficulty?: string | null;
  category?: string | null;
  duration?: string | null;
  thumbnailUrl?: string | null;
  featured?: boolean;
};

type Props = {
  drills: RelatedDrill[];
  title?: string;
};

const DIFF_TONE: Record<string, string> = {
  Easy: "oklch(60% 0.15 150)",
  Medium: "oklch(70% 0.18 60)",
  Hard: "oklch(60% 0.2 25)",
};

export function RelatedDrillsCarousel({ drills, title = "RELATED DRILLS" }: Props) {
  if (!drills || drills.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold tracking-widest mb-3 text-white/55">{title}</h3>

      {/* Mobile: horizontal scroll-snap. Desktop: 3-up grid. */}
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-4 md:overflow-visible pb-2 -mx-1 px-1">
        {drills.map((d) => {
          const diffColor = d.difficulty ? DIFF_TONE[d.difficulty] : undefined;
          const fallbackImg = `/images/drills/${d.drillId.toLowerCase().replace(/[^a-z0-9]/g, "-")}.jpg`;
          return (
            <Link key={d.drillId} href={`/drill/${d.drillId}`}>
              <a className="snap-start flex-shrink-0 w-[280px] md:w-auto rounded-xl overflow-hidden border border-white/10 bg-white/[0.02] hover:border-white/25 transition-colors group relative">
                {d.featured && (
                  <span
                    className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: "oklch(75% 0.15 80)", color: "oklch(15% 0.02 80)" }}
                  >
                    <Star className="h-3 w-3 fill-current" />
                    Featured
                  </span>
                )}
                <div className="relative aspect-video bg-black/40 overflow-hidden">
                  <img
                    src={d.thumbnailUrl || fallbackImg}
                    alt={d.name}
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {d.duration && d.duration !== "Unknown" && (
                    <span className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 text-white/90 backdrop-blur-sm">
                      <Clock className="h-2.5 w-2.5" />
                      {d.duration}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h4 className="text-sm font-semibold text-white leading-tight mb-1.5 line-clamp-2 group-hover:text-white">
                    {d.name}
                  </h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {d.difficulty && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ color: diffColor, backgroundColor: diffColor ? `${diffColor.replace(")", " / 0.15)")}` : undefined }}
                      >
                        {d.difficulty}
                      </span>
                    )}
                    {d.category && (
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/55">
                        {d.category}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
