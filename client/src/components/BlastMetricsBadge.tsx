import { trpc } from "@/lib/trpc";
import { Zap, Activity, Target, Crosshair, Gauge } from "lucide-react";

interface BlastMetricsBadgeProps {
  blastSessionId: string;
}

/** Compact inline display of Blast metrics for a linked session note */
export function BlastMetricsBadge({ blastSessionId }: BlastMetricsBadgeProps) {
  const { data, isLoading } = trpc.blastMetrics.getBlastDataForSessionNote.useQuery(
    { blastSessionId },
    { enabled: !!blastSessionId }
  );

  if (isLoading || !data) return null;

  const metrics = [
    { label: "Bat Speed", value: data.batSpeedMph, unit: "mph", color: "text-[#E8425A]", icon: Zap },
    { label: "Rot. Accel", value: data.rotationalAccelerationG, unit: "g", color: "text-violet-400", icon: Activity },
    { label: "Plane", value: data.planeScore, unit: "", color: "text-green-400", icon: Target },
    { label: "Connection", value: data.connectionScore, unit: "", color: "text-yellow-400", icon: Crosshair },
    { label: "Rotation", value: data.rotationScore, unit: "", color: "text-red-400", icon: Gauge },
    { label: "Power", value: data.powerKw, unit: "kW", color: "text-pink-400", icon: Zap },
  ].filter(m => m.value != null);

  if (metrics.length === 0) return null;

  return (
    <div className="mt-2 p-2.5 rounded-lg bg-violet-500/[0.06] border border-violet-500/15">
      <div className="flex items-center gap-1.5 mb-2">
        <div className="h-4 w-4 rounded bg-violet-500/20 flex items-center justify-center">
          <Zap className="h-2.5 w-2.5 text-violet-400" />
        </div>
        <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">
          Blast Motion — {data.sessionType}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {metrics.map((m) => {
          const Icon = m.icon;
          const displayVal = typeof m.value === "number"
            ? m.value
            : parseFloat(m.value as string).toFixed(1);
          return (
            <span key={m.label} className="flex items-center gap-1 text-xs">
              <Icon className={`h-3 w-3 ${m.color}`} />
              <span className="text-white/50">{m.label}:</span>
              <span className={`font-medium ${m.color}`}>
                {displayVal}{m.unit && <span className="text-white/30 ml-0.5">{m.unit}</span>}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
