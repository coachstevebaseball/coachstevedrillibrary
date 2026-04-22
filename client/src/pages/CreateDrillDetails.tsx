import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { ArrowLeft, Plus, X, Tag, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { filterOptions } from "@/data/drillConstants";
import { useAllDrills } from "@/hooks/useAllDrills";

function TagSelector({ label, options, selected, onChange }: {
  label: string;
  options: { value: string; label: string }[] | string[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const normalized = options.map(o => typeof o === "string" ? { value: o, label: o } : o);
  const toggle = (val: string) =>
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  return (
    <div>
      <Label className="text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
        <Tag className="h-3.5 w-3.5" /> {label}
      </Label>
      <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-white/10 bg-white/[0.03] min-h-10">
        {normalized.map(o => (
          <button key={o.value} type="button" onClick={() => toggle(o.value)}
            className={`text-xs px-2 py-1 rounded-md border transition-colors ${
              selected.includes(o.value)
                ? "bg-[#e4002b]/20 border-[#e4002b]/40 text-[#e4002b]"
                : "border-white/10 text-white/50 hover:border-white/30 hover:text-white/70"
            }`}>
            {selected.includes(o.value) && <CheckCircle2 className="inline h-2.5 w-2.5 mr-1" />}
            {o.label}
          </button>
        ))}
      </div>
      {selected.length > 0 && <p className="text-xs text-white/30 mt-1">{selected.length} selected</p>}
    </div>
  );
}

function StepListEditor({ label, steps, onChange, placeholder }: {
  label: string; steps: string[]; onChange: (steps: string[]) => void; placeholder?: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const update = (i: number, val: string) => { const n = [...steps]; n[i] = val; onChange(n); };
  const addAfter = (i: number) => {
    const n = [...steps]; n.splice(i + 1, 0, ""); onChange(n);
    setTimeout(() => refs.current[i + 1]?.focus(), 50);
  };
  const remove = (i: number) => {
    if (steps.length <= 1) { onChange([""]); return; }
    onChange(steps.filter((_, idx) => idx !== i));
    setTimeout(() => refs.current[Math.max(0, i - 1)]?.focus(), 50);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === "Enter") { e.preventDefault(); addAfter(i); }
    else if (e.key === "Backspace" && steps[i] === "" && steps.length > 1) { e.preventDefault(); remove(i); }
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-xs text-white/30">Enter = new step · Backspace on empty = remove</span>
      </div>
      <div className="space-y-1.5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 group">
            <span className="text-xs text-white/20 w-5 text-right flex-shrink-0 font-mono">{i + 1}.</span>
            <input ref={el => { refs.current[i] = el; }} value={step}
              onChange={e => update(i, e.target.value)}
              onKeyDown={e => handleKeyDown(e, i)}
              placeholder={placeholder || `Step ${i + 1}...`}
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-md text-white text-sm px-3 py-2 focus:outline-none focus:border-[#e4002b]/40 placeholder:text-white/20" />
            <button type="button" onClick={() => remove(i)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/30 hover:text-red-400 transition-all">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button type="button"
        onClick={() => { onChange([...steps, ""]); setTimeout(() => refs.current[steps.length]?.focus(), 50); }}
        className="mt-2 text-xs text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors">
        <Plus className="h-3 w-3" /> Add step
      </button>
    </div>
  );
}

const DRILL_TYPES = ["Tee","Soft Toss","Front Toss","Live BP","Machine BP","Game Situation","Shadow","Overload/Underload","Partner","Solo"];
const PILLARS = [
  "Vision & Pitch Recognition","Bat Speed","On-Plane Efficiency","Attack Angle","Hip Rotation",
  "Weight Transfer","Balance & Posture","Mental Approach","Situational Hitting","Two-Strike Approach",
  "Power Development","Contact Rate",
];

export default function CreateDrillDetails() {
  const [selectedDrill, setSelectedDrill] = useState<string>("");
  const [formData, setFormData] = useState({
    skillSet: "", difficulty: "Medium", athletes: "", time: "", equipment: "", goal: "",
    description: [""], commonMistakes: [""], progressions: [""],
    drillType: "", ageLevel: [] as string[], focusTags: [] as string[],
    problemsFix: [] as string[], pillars: [] as string[],
  });

  const saveMutation = trpc.drillDetails.saveDrillInstructions.useMutation({
    onSuccess: () => {
      toast.success("Drill details saved!");
      setSelectedDrill("");
      setFormData({
        skillSet: "", difficulty: "Medium", athletes: "", time: "", equipment: "", goal: "",
        description: [""], commonMistakes: [""], progressions: [""],
        drillType: "", ageLevel: [], focusTags: [], problemsFix: [], pillars: [],
      });
    },
    onError: err => toast.error("Error: " + err.message),
  });

  const handleSave = () => {
    if (!selectedDrill) { toast.error("Please select a drill"); return; }
    if (!formData.goal || !formData.skillSet) { toast.error("Goal and Skill Set are required"); return; }
    saveMutation.mutate({
      drillId: selectedDrill,
      skillSet: formData.skillSet, difficulty: formData.difficulty, athletes: formData.athletes,
      time: formData.time, equipment: formData.equipment, goal: formData.goal,
      description: formData.description.filter(d => d.trim()),
      commonMistakes: formData.commonMistakes.filter(m => m.trim()),
      progressions: formData.progressions.filter(p => p.trim()),
      drillType: formData.drillType || undefined,
      ageLevel: formData.ageLevel.length ? formData.ageLevel : undefined,
      focusTags: formData.focusTags.length ? formData.focusTags : undefined,
      problemsFix: formData.problemsFix.length ? formData.problemsFix : undefined,
      pillars: formData.pillars.length ? formData.pillars : undefined,
    });
  };

  const allDrills = useAllDrills();
  const selectedDrillData = allDrills.find(d => d.id === selectedDrill);

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="container max-w-4xl py-8">
        <Link href="/coach-dashboard">
          <Button variant="ghost" className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Button>
        </Link>
        <div className="grid gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Create Drill Details</h1>
            <p className="text-muted-foreground text-sm">Add steps, coaching cues, and metadata tags for any drill.</p>
          </div>

          <Card>
            <CardHeader><CardTitle>Select Drill</CardTitle></CardHeader>
            <CardContent>
              <Select value={selectedDrill} onValueChange={setSelectedDrill}>
                <SelectTrigger><SelectValue placeholder="Select a drill..." /></SelectTrigger>
                <SelectContent className="max-h-96">
                  {allDrills.map(drill => <SelectItem key={drill.id} value={drill.id}>{drill.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {selectedDrillData && (
                <p className="text-sm text-muted-foreground mt-2"><strong>{selectedDrillData.name}</strong> — {selectedDrillData.difficulty}</p>
              )}
            </CardContent>
          </Card>

          {selectedDrill && (
            <>
              <Card>
                <CardHeader><CardTitle>Drill Info</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="goal">Goal / Title *</Label>
                      <Input id="goal" value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} placeholder="e.g., Improve hip rotation and power sequence" />
                    </div>
                    <div>
                      <Label htmlFor="skillSet">Skill Set *</Label>
                      <Input id="skillSet" value={formData.skillSet} onChange={e => setFormData({...formData, skillSet: e.target.value})} placeholder="e.g., Hitting, Pitching" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Difficulty</Label>
                      <Select value={formData.difficulty} onValueChange={v => setFormData({...formData, difficulty: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{["Easy","Medium","Hard","Advanced"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Duration</Label>
                      <Input value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} placeholder="e.g., 10 minutes" />
                    </div>
                    <div>
                      <Label>Athletes</Label>
                      <Input value={formData.athletes} onChange={e => setFormData({...formData, athletes: e.target.value})} placeholder="e.g., 1-2 + coach" />
                    </div>
                  </div>
                  <div>
                    <Label>Equipment</Label>
                    <Input value={formData.equipment} onChange={e => setFormData({...formData, equipment: e.target.value})} placeholder="e.g., Tee, baseballs, net" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Step-by-Step Instructions</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <StepListEditor label="Drill Steps *" steps={formData.description} onChange={s => setFormData({...formData, description: s})} placeholder="Describe this step..." />
                  <div className="h-px bg-white/[0.06]" />
                  <StepListEditor label="Common Mistakes" steps={formData.commonMistakes} onChange={s => setFormData({...formData, commonMistakes: s})} placeholder="A common mistake to avoid..." />
                  <div className="h-px bg-white/[0.06]" />
                  <StepListEditor label="Progressions / Variations" steps={formData.progressions} onChange={s => setFormData({...formData, progressions: s})} placeholder="How to progress or vary this drill..." />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5 text-[#e4002b]" />Drill Metadata & Tags</CardTitle>
                  <p className="text-sm text-muted-foreground">Tag for filtering and athlete matching</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="mb-2 block">Drill Type</Label>
                    <Select value={formData.drillType} onValueChange={v => setFormData({...formData, drillType: v})}>
                      <SelectTrigger><SelectValue placeholder="Select drill type..." /></SelectTrigger>
                      <SelectContent>{DRILL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <TagSelector label="Age / Skill Level" options={filterOptions.ageLevel} selected={formData.ageLevel} onChange={v => setFormData({...formData, ageLevel: v})} />
                  <TagSelector label="Focus Areas / Tags" options={filterOptions.tags} selected={formData.focusTags} onChange={v => setFormData({...formData, focusTags: v})} />
                  <TagSelector label="Problems This Drill Fixes" options={filterOptions.problem} selected={formData.problemsFix} onChange={v => setFormData({...formData, problemsFix: v})} />
                  <TagSelector label="Coaching Pillars" options={PILLARS} selected={formData.pillars} onChange={v => setFormData({...formData, pillars: v})} />
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={saveMutation.isPending} className="flex-1 bg-[#e4002b] hover:bg-[#c0001f]">
                  {saveMutation.isPending ? "Saving..." : "Save Drill Details"}
                </Button>
                <Link href="/coach-dashboard"><Button variant="outline">Cancel</Button></Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
