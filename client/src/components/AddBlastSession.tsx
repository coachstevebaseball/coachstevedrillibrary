import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Zap, Activity, Target, Crosshair, Gauge, Timer } from "lucide-react";

const SESSION_TYPES = [
  "Tee",
  "Soft Toss",
  "Front Toss",
  "Live BP",
  "Machine BP",
  "Game At-Bat",
  "Live Pitching",
  "Overload/Underload",
  "General",
];

// Metric field definitions with labels, units, and placeholder values
const SCORE_KEYS = new Set(["planeScore", "connectionScore", "rotationScore"]);

const METRIC_FIELDS = [
  { key: "batSpeedMph", label: "Bat Speed", unit: "mph", placeholder: "65.0", icon: Zap, color: "text-blue-400" },
  { key: "rotationalAccelerationG", label: "Rotational Accel", unit: "g", placeholder: "12.5", icon: Activity, color: "text-violet-400" },
  { key: "planeScore", label: "Plane Score", unit: "", placeholder: "78", icon: Target, color: "text-green-400" },
  { key: "connectionScore", label: "Connection Score", unit: "", placeholder: "82", icon: Crosshair, color: "text-yellow-400" },
  { key: "rotationScore", label: "Rotation Score", unit: "", placeholder: "75", icon: Gauge, color: "text-red-400" },
  { key: "powerKw", label: "Power", unit: "kW", placeholder: "1.85", icon: Zap, color: "text-pink-400" },
  { key: "peakHandSpeedMph", label: "Peak Hand Speed", unit: "mph", placeholder: "22.0", icon: Zap, color: "text-cyan-400" },
  { key: "onPlaneEfficiencyPercent", label: "On-Plane Efficiency", unit: "%", placeholder: "85.0", icon: Target, color: "text-teal-400" },
  { key: "attackAngleDeg", label: "Attack Angle", unit: "deg", placeholder: "10.5", icon: Target, color: "text-lime-400" },
  { key: "earlyConnectionDeg", label: "Early Connection", unit: "deg", placeholder: "95.0", icon: Crosshair, color: "text-amber-400" },
  { key: "connectionAtImpactDeg", label: "Connection at Impact", unit: "deg", placeholder: "90.0", icon: Crosshair, color: "text-orange-400" },
  { key: "verticalBatAngleDeg", label: "Vertical Bat Angle", unit: "deg", placeholder: "-25.0", icon: Gauge, color: "text-indigo-400" },
  { key: "timeToContactSec", label: "Time to Contact", unit: "sec", placeholder: "0.150", icon: Timer, color: "text-rose-400" },
] as const;

type MetricKey = typeof METRIC_FIELDS[number]["key"];

interface AddBlastSessionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: string;
  playerName: string;
}

export function AddBlastSession({ open, onOpenChange, playerId, playerName }: AddBlastSessionProps) {
  const [sessionDate, setSessionDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [sessionType, setSessionType] = useState("");
  const [metrics, setMetrics] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const utils = trpc.useUtils();

  const addSessionMutation = trpc.blastMetrics.addSession.useMutation({
    onSuccess: () => {
      toast.success("Session added successfully!", {
        description: `${sessionType} session for ${playerName} on ${new Date(sessionDate).toLocaleDateString()}`,
      });
      // Invalidate all blast metrics queries to refresh data
      utils.blastMetrics.invalidate();
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to add session", { description: error.message });
    },
    onSettled: () => setSaving(false),
  });

  function resetForm() {
    setSessionDate(new Date().toISOString().split("T")[0]);
    setSessionType("");
    setMetrics({});
  }

  function handleMetricChange(key: string, value: string) {
    setMetrics((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!sessionDate) {
      toast.error("Please select a session date");
      return;
    }
    if (!sessionType) {
      toast.error("Please select a session type");
      return;
    }

    setSaving(true);

    // Build metrics object — scores are numbers, everything else is string
    const metricsPayload: Record<string, any> = {};
    for (const field of METRIC_FIELDS) {
      const val = metrics[field.key]?.trim();
      if (!val) continue;
      if (SCORE_KEYS.has(field.key)) {
        const num = parseInt(val, 10);
        if (!isNaN(num)) metricsPayload[field.key] = num;
      } else {
        metricsPayload[field.key] = val;
      }
    }

    addSessionMutation.mutate({
      playerId,
      sessionDate,
      sessionType,
      metrics: metricsPayload,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0f1225] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-violet-400" />
            Add Blast Session
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Enter session data for <span className="text-white/80 font-medium">{playerName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Session Info Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">Session Date *</Label>
              <Input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="bg-white/[0.06] border-white/[0.1] text-white [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70 text-sm">Session Type *</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger className="bg-white/[0.06] border-white/[0.1] text-white">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-xs text-white/30 uppercase tracking-wider font-medium">Swing Metrics</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {METRIC_FIELDS.map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-white/60 text-xs flex items-center gap-1.5">
                    <Icon className={`h-3 w-3 ${field.color}`} />
                    {field.label}
                    {field.unit && <span className="text-white/30">({field.unit})</span>}
                  </Label>
                  <Input
                    type="number"
                    step={SCORE_KEYS.has(field.key) ? "1" : "0.01"}
                    min={SCORE_KEYS.has(field.key) ? "0" : undefined}
                    max={SCORE_KEYS.has(field.key) ? "100" : undefined}
                    placeholder={field.placeholder}
                    value={metrics[field.key] || ""}
                    onChange={(e) => handleMetricChange(field.key, e.target.value)}
                    className="bg-white/[0.06] border-white/[0.1] text-white h-8 text-sm"
                  />
                </div>
              );
            })}
          </div>

          <p className="text-xs text-white/30 italic">
            All metric fields are optional. Enter only the values you have from the Blast report.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-white/60 hover:text-white hover:bg-white/[0.06]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !sessionDate || !sessionType}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Session
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
