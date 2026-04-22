import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Tag, Search, CheckCircle2, Save, RefreshCw, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { filterOptions } from "@/data/drillConstants";
import { useAllDrills } from "@/hooks/useAllDrills";

const DRILL_TYPES = ["Tee","Soft Toss","Front Toss","Live BP","Machine BP","Game Situation","Shadow","Overload/Underload","Partner","Solo"];
const PILLARS = [
  "Vision & Pitch Recognition","Bat Speed","On-Plane Efficiency","Attack Angle","Hip Rotation",
  "Weight Transfer","Balance & Posture","Mental Approach","Situational Hitting","Two-Strike Approach",
  "Power Development","Contact Rate",
];

function TagChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-2 py-1 rounded-md border transition-colors ${
        selected
          ? "bg-[#e4002b]/20 border-[#e4002b]/40 text-[#e4002b]"
          : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/60"
      }`}
    >
      {selected && <CheckCircle2 className="inline h-2.5 w-2.5 mr-1" />}
      {label}
    </button>
  );
}

type DrillMeta = {
  drillType?: string;
  ageLevel?: string[];
  focusTags?: string[];
  problemsFix?: string[];
  pillars?: string[];
};

function DrillTagRow({ drillId, drillName }: { drillId: string; drillName: string }) {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const utils = trpc.useUtils();

  const { data: detail } = trpc.drillDetails.getDrillDetail.useQuery(
    { drillId },
    { enabled: open }
  );

  const [meta, setMeta] = useState<DrillMeta>({
    drillType: "", ageLevel: [], focusTags: [], problemsFix: [], pillars: [],
  });

  // Sync from DB when detail loads (only once, before user edits)
  useEffect(() => {
    if (detail && !dirty) {
      setMeta({
        drillType: (detail as any)?.drillType || "",
        ageLevel: (detail as any)?.ageLevel || [],
        focusTags: (detail as any)?.focusTags || [],
        problemsFix: (detail as any)?.problemsFix || [],
        pillars: (detail as any)?.pillars || [],
      });
    }
  }, [detail]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentMeta = meta;

  const updateMeta = (patch: Partial<DrillMeta>) => {
    setMeta(m => ({ ...m, ...patch }));
    setDirty(true);
  };

  const toggleTag = (field: keyof DrillMeta, val: string) => {
    const current = (currentMeta[field] as string[]) || [];
    updateMeta({ [field]: current.includes(val) ? current.filter(v => v !== val) : [...current, val] });
  };

  const saveMutation = trpc.drillDetails.updateDrillMetadata.useMutation({
    onSuccess: () => {
      toast.success(`Tags saved for "${drillName}"`);
      utils.drillDetails.getDrillDetail.invalidate({ drillId });
      setDirty(false);
    },
    onError: err => toast.error(`Failed: ${err.message}`),
  });

  const handleSave = () => {
    saveMutation.mutate({ drillId, ...currentMeta });
  };

  const tagCount = [
    currentMeta.drillType ? 1 : 0,
    (currentMeta.ageLevel?.length || 0),
    (currentMeta.focusTags?.length || 0),
    (currentMeta.problemsFix?.length || 0),
    (currentMeta.pillars?.length || 0),
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="border border-white/[0.06] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-medium text-white/80 truncate">{drillName}</span>
          {tagCount > 0 && (
            <Badge variant="outline" className="border-[#e4002b]/30 text-[#e4002b] text-[10px] flex-shrink-0">
              {tagCount} tag{tagCount !== 1 ? "s" : ""}
            </Badge>
          )}
          {dirty && (
            <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px] flex-shrink-0">
              unsaved
            </Badge>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-white/30 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-white/30 flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-white/[0.06] pt-3 space-y-4 bg-white/[0.01]">
          {/* Drill Type */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Drill Type</label>
            <Select value={currentMeta.drillType || ""} onValueChange={v => updateMeta({ drillType: v })}>
              <SelectTrigger className="w-44 h-8 bg-white/[0.04] border-white/10 text-white text-xs">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— None —</SelectItem>
                {DRILL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Age Level */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Age / Skill Level</label>
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.ageLevel.map(o => (
                <TagChip key={o.value} label={o.label}
                  selected={(currentMeta.ageLevel || []).includes(o.value)}
                  onClick={() => toggleTag("ageLevel", o.value)} />
              ))}
            </div>
          </div>

          {/* Focus Tags */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Focus Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.tags.map(t => (
                <TagChip key={t} label={t}
                  selected={(currentMeta.focusTags || []).includes(t)}
                  onClick={() => toggleTag("focusTags", t)} />
              ))}
            </div>
          </div>

          {/* Problems it fixes */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Fixes Problems</label>
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.problem.map(o => (
                <TagChip key={o.value} label={o.label}
                  selected={(currentMeta.problemsFix || []).includes(o.value)}
                  onClick={() => toggleTag("problemsFix", o.value)} />
              ))}
            </div>
          </div>

          {/* Coaching Pillars */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Coaching Pillars</label>
            <div className="flex flex-wrap gap-1.5">
              {PILLARS.map(p => (
                <TagChip key={p} label={p}
                  selected={(currentMeta.pillars || []).includes(p)}
                  onClick={() => toggleTag("pillars", p)} />
              ))}
            </div>
          </div>

          {dirty && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-[#e4002b] hover:bg-[#c0001f] text-white gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              {saveMutation.isPending ? "Saving..." : "Save Tags"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function DrillTagEditor() {
  const allDrills = useAllDrills();
  const [search, setSearch] = useState("");
  const [filterTagged, setFilterTagged] = useState<"all" | "tagged" | "untagged">("all");

  const drills = useMemo(() => {
    return allDrills.filter((d: any) => {
      if (!search) return true;
      return d.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [allDrills, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search drills..."
            className="pl-8 bg-white/[0.06] border-white/10 text-white h-8 text-sm"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "tagged", "untagged"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterTagged(f)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors capitalize ${
                filterTagged === f
                  ? "bg-[#e4002b] text-white"
                  : "bg-white/[0.06] text-white/50 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-white/30">
        Click any drill to expand and edit its tags. Changes save per-drill.
        Showing {drills.length} of {allDrills.length} drills.
      </p>

      <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
        {drills.map(drill => (
          <DrillTagRow key={drill.id} drillId={drill.id} drillName={drill.name} />
        ))}
      </div>
    </div>
  );
}
