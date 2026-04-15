import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, CheckCircle2, Tag } from "lucide-react";
import { filterOptions } from "@/data/drills";

const DRILL_TYPES = ["Tee","Soft Toss","Front Toss","Live BP","Machine BP","Game Situation","Shadow","Overload/Underload","Partner","Solo"];
const PILLARS = [
  "Vision & Pitch Recognition","Bat Speed","On-Plane Efficiency","Attack Angle","Hip Rotation",
  "Weight Transfer","Balance & Posture","Mental Approach","Situational Hitting","Two-Strike Approach",
  "Power Development","Contact Rate",
];
// Only Hitting drills are active for now. Other categories are archived and can be restored later.
const CATEGORIES = ["Hitting"];
const DIFFICULTIES = ["Easy","Medium","Hard","Advanced"];
const DURATIONS = ["5m","10m","15m","20m","30m","45m","60m"];

function TagChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`text-xs px-2 py-1 rounded-md border transition-colors ${
        selected
          ? "bg-[#e4002b]/20 border-[#e4002b]/40 text-[#e4002b]"
          : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/60"
      }`}>
      {selected && <CheckCircle2 className="inline h-2.5 w-2.5 mr-1" />}
      {label}
    </button>
  );
}

const EMPTY = {
  name: "", difficulty: "Medium", category: "Hitting", duration: "10m",
  goal: "", instructions: "", videoUrl: "",
  drillType: "", ageLevel: [] as string[], focusTags: [] as string[],
  problemsFix: [] as string[], pillars: [] as string[],
};

export function AddNewDrill() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const toggleTag = (field: string, val: string) => {
    const arr = (form as any)[field] as string[];
    set(field, arr.includes(val) ? arr.filter((v: string) => v !== val) : [...arr, val]);
  };

  const utils = trpc.useUtils();
  const mutation = trpc.drillDetails.createNewDrill.useMutation({
    onSuccess: (data) => {
      toast.success(`Drill "${form.name}" created!`);
      setForm({ ...EMPTY });
      setOpen(false);
      utils.drillDetails.getCustomDrills.invalidate();
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Drill name is required"); return; }
    mutation.mutate({
      name: form.name.trim(),
      difficulty: form.difficulty,
      category: form.category,
      duration: form.duration,
      goal: form.goal || undefined,
      instructions: form.instructions || undefined,
      videoUrl: form.videoUrl || undefined,
      drillType: form.drillType && form.drillType !== "none" ? form.drillType : undefined,
      ageLevel: form.ageLevel.length ? form.ageLevel : undefined,
      focusTags: form.focusTags.length ? form.focusTags : undefined,
      problemsFix: form.problemsFix.length ? form.problemsFix : undefined,
      pillars: form.pillars.length ? form.pillars : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 bg-[#e4002b] hover:bg-[#c0001f] text-white">
          <Plus className="h-4 w-4" /> Add New Drill
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0f1419] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#e4002b]" /> Create New Drill
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Core Info */}
          <div className="space-y-3">
            <div>
              <Label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Drill Name *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="e.g., 3-Plate Adjustment Drill"
                className="bg-white/[0.06] border-white/10 text-white" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Difficulty</Label>
                <Select value={form.difficulty} onValueChange={v => set("difficulty", v)}>
                  <SelectTrigger className="bg-white/[0.06] border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>{DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Category</Label>
                <Select value={form.category} onValueChange={v => set("category", v)}>
                  <SelectTrigger className="bg-white/[0.06] border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Duration</Label>
                <Select value={form.duration} onValueChange={v => set("duration", v)}>
                  <SelectTrigger className="bg-white/[0.06] border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>{DURATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Goal / Objective</Label>
              <Input value={form.goal} onChange={e => set("goal", e.target.value)}
                placeholder="What is the main objective?"
                className="bg-white/[0.06] border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">Instructions</Label>
              <Textarea value={form.instructions} onChange={e => set("instructions", e.target.value)}
                placeholder="Step-by-step instructions..."
                className="bg-white/[0.06] border-white/10 text-white min-h-[80px]" />
            </div>
            <div>
              <Label className="text-white/60 text-xs uppercase tracking-wider mb-1.5 block">YouTube URL (optional)</Label>
              <Input value={form.videoUrl} onChange={e => set("videoUrl", e.target.value)}
                placeholder="https://youtu.be/..."
                className="bg-white/[0.06] border-white/10 text-white" />
            </div>
          </div>

          {/* Metadata / Tags */}
          <div className="border-t border-white/[0.08] pt-4 space-y-4">
            <p className="text-xs text-white/50 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" /> Drill Tags & Metadata
            </p>

            <div>
              <Label className="text-white/40 text-xs mb-1.5 block">Drill Type</Label>
              <Select value={form.drillType} onValueChange={v => set("drillType", v)}>
                <SelectTrigger className="w-44 bg-white/[0.06] border-white/10 text-white text-xs h-8">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {DRILL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white/40 text-xs mb-1.5 block">Age / Skill Level</Label>
              <div className="flex flex-wrap gap-1.5">
                {filterOptions.ageLevel.map(o => (
                  <TagChip key={o.value} label={o.label}
                    selected={form.ageLevel.includes(o.value)}
                    onClick={() => toggleTag("ageLevel", o.value)} />
                ))}
              </div>
            </div>

            <div>
              <Label className="text-white/40 text-xs mb-1.5 block">Focus Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {filterOptions.tags.map(t => (
                  <TagChip key={t} label={t}
                    selected={form.focusTags.includes(t)}
                    onClick={() => toggleTag("focusTags", t)} />
                ))}
              </div>
            </div>

            <div>
              <Label className="text-white/40 text-xs mb-1.5 block">Problems This Drill Fixes</Label>
              <div className="flex flex-wrap gap-1.5">
                {filterOptions.problem.map(o => (
                  <TagChip key={o.value} label={o.label}
                    selected={form.problemsFix.includes(o.value)}
                    onClick={() => toggleTag("problemsFix", o.value)} />
                ))}
              </div>
            </div>

            <div>
              <Label className="text-white/40 text-xs mb-1.5 block">Coaching Pillars</Label>
              <div className="flex flex-wrap gap-1.5">
                {PILLARS.map(p => (
                  <TagChip key={p} label={p}
                    selected={form.pillars.includes(p)}
                    onClick={() => toggleTag("pillars", p)} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2 border-t border-white/[0.08]">
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-white/50 hover:text-white">Cancel</Button>
          <Button onClick={handleSave} disabled={mutation.isPending}
            className="flex-1 bg-[#e4002b] hover:bg-[#c0001f] text-white">
            {mutation.isPending ? "Creating..." : "Create Drill"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
