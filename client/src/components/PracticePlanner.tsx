import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus, Trash2, Clock, Search, Copy, Share2, Edit3,
  ChevronDown, ChevronUp, Calendar, Target, Dumbbell,
  Coffee, Zap, ArrowLeft, Check, Eye, EyeOff,
  MoreVertical, BookOpen,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import drillsData from "@/data/drills.json";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DrillItem {
  id: string;
  name: string;
  difficulty: string;
  categories: string[];
  duration: string;
}

interface PlanBlock {
  id: string;
  sortOrder: number;
  blockType: "drill" | "warmup" | "cooldown" | "break" | "custom";
  drillId?: string | null;
  title: string;
  duration: number;
  sets?: number | null;
  reps?: number | null;
  notes?: string | null;
}

type ViewMode = "list" | "create" | "edit" | "detail";

const FOCUS_AREAS = [
  "Hitting", "Pitching", "Fielding", "Catching",
  "Baserunning", "Throwing", "Mental Game", "Conditioning",
  "Warm-Up", "Cool-Down",
];

const BLOCK_TYPE_CONFIG = {
  drill: { icon: Target, label: "Drill", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  warmup: { icon: Zap, label: "Warm-Up", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  cooldown: { icon: Coffee, label: "Cool-Down", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  break: { icon: Coffee, label: "Break", color: "text-gray-400", bg: "bg-gray-500/10 border-gray-500/20" },
  custom: { icon: Dumbbell, label: "Custom", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
};

let _tempId = 0;
function tempId() { return `tmp-${++_tempId}-${Date.now()}`; }

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PracticePlanner() {
  const [view, setView] = useState<ViewMode>("list");
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [detailPlanId, setDetailPlanId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const utils = trpc.useUtils();
  const { data: plans = [], isLoading: plansLoading } = trpc.practicePlans.getAll.useQuery();
  const { data: allUsers = [] } = trpc.admin.getAllUsers.useQuery();
  const { data: allInvites = [] } = trpc.invites.getAllInvites.useQuery();

  const athleteOptions = useMemo(() => {
    const opts: { id: string; name: string; email: string; type: "user" | "invite"; userId?: number; inviteId?: number }[] = [];
    allUsers.forEach((u: any) => {
      if (u.role !== "admin") {
        opts.push({ id: `user-${u.id}`, name: u.name || u.email?.split("@")[0] || `User ${u.id}`, email: u.email || "", type: "user", userId: u.id });
      }
    });
    allInvites.forEach((inv: any) => {
      if (inv.status === "pending" || inv.status === "accepted") {
        const existing = allUsers.find((u: any) => u.email === inv.email);
        if (!existing) {
          opts.push({ id: `invite-${inv.id}`, name: inv.email.split("@")[0], email: inv.email, type: "invite", inviteId: inv.id });
        }
      }
    });
    return opts;
  }, [allUsers, allInvites]);

  const createMutation = trpc.practicePlans.create.useMutation({
    onSuccess: () => { utils.practicePlans.getAll.invalidate(); setView("list"); toast.success("Practice plan saved successfully."); },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.practicePlans.update.useMutation({
    onSuccess: () => { utils.practicePlans.getAll.invalidate(); setView("list"); toast.success("Changes saved."); },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.practicePlans.delete.useMutation({
    onSuccess: () => { utils.practicePlans.getAll.invalidate(); toast.success("Practice plan removed."); },
    onError: (err) => toast.error(err.message),
  });
  const duplicateMutation = trpc.practicePlans.duplicate.useMutation({
    onSuccess: () => { utils.practicePlans.getAll.invalidate(); toast.success("Plan copy created."); },
    onError: (err) => toast.error(err.message),
  });
  const toggleShareMutation = trpc.practicePlans.toggleShare.useMutation({
    onSuccess: () => { utils.practicePlans.getAll.invalidate(); toast.success("Share status changed."); },
    onError: (err) => toast.error(err.message),
  });

  const filteredPlans = useMemo(() => {
    return plans.filter((p: any) => {
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const matchesSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [plans, statusFilter, searchQuery]);

  const handleCreate = () => { setEditingPlanId(null); setView("create"); };
  const handleEdit = (planId: number) => { setEditingPlanId(planId); setView("edit"); };
  const handleViewDetail = (planId: number) => { setDetailPlanId(planId); setView("detail"); };
  const handleDelete = (planId: number) => { if (confirm("Delete this practice plan?")) deleteMutation.mutate({ planId }); };
  const handleDuplicate = (planId: number) => { duplicateMutation.mutate({ planId }); };
  const handleToggleShare = (planId: number, currentlyShared: boolean) => { toggleShareMutation.mutate({ planId, isShared: !currentlyShared }); };

  if (view === "create" || view === "edit") {
    return (
      <PlanForm
        planId={editingPlanId}
        athleteOptions={athleteOptions}
        onCancel={() => setView("list")}
        onSave={(data) => {
          if (editingPlanId) updateMutation.mutate({ planId: editingPlanId, ...data });
          else createMutation.mutate(data);
        }}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    );
  }

  if (view === "detail" && detailPlanId) {
    return (
      <PlanDetail
        planId={detailPlanId}
        onBack={() => setView("list")}
        onEdit={() => handleEdit(detailPlanId)}
        onToggleShare={handleToggleShare}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-white">Practice Planner</h2>
          <p className="text-sm text-white/50 mt-1">Plan and organize your training sessions</p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="h-4 w-4" /> New Plan
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input placeholder="Search plans..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/30" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["all", "draft", "scheduled", "completed", "cancelled"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${statusFilter === s ? "bg-blue-600 text-white" : "bg-white/[0.06] text-white/50 hover:text-white/80"}`}>
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {plansLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-32 bg-white/[0.04] rounded-xl animate-pulse" />)}</div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.03] rounded-xl border border-white/[0.06]">
          <Target className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white/80 mb-2">{plans.length === 0 ? "No practice plans yet" : "No plans match your filters"}</h3>
          <p className="text-sm text-white/40 mb-6 max-w-md mx-auto">{plans.length === 0 ? "Create your first practice plan to organize training sessions." : "Try adjusting your search or filter criteria."}</p>
          {plans.length === 0 && (
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2"><Plus className="h-4 w-4" /> Create First Plan</Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPlans.map((plan: any) => (
            <PlanCard key={plan.id} plan={plan}
              onView={() => handleViewDetail(plan.id)} onEdit={() => handleEdit(plan.id)}
              onDelete={() => handleDelete(plan.id)} onDuplicate={() => handleDuplicate(plan.id)}
              onToggleShare={() => handleToggleShare(plan.id, !!plan.isShared)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Plan Card ───────────────────────────────────────────────────────────────

function PlanCard({ plan, onView, onEdit, onDelete, onDuplicate, onToggleShare }: {
  plan: any; onView: () => void; onEdit: () => void; onDelete: () => void; onDuplicate: () => void; onToggleShare: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const statusColors: Record<string, string> = {
    draft: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    scheduled: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    completed: "bg-green-500/20 text-green-300 border-green-500/30",
    cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  const focusAreas = (plan.focusAreas as string[]) || [];

  return (
    <Card className="bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06] transition-all cursor-pointer group" onClick={onView}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="font-heading font-bold text-white text-lg truncate">{plan.title}</h3>
              <Badge variant="outline" className={`text-[10px] ${statusColors[plan.status] || statusColors.draft}`}>{plan.status}</Badge>
              {plan.isShared ? (
                <Badge variant="outline" className="text-[10px] bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                  <Share2 className="h-2.5 w-2.5 mr-1" /> Shared
                </Badge>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/40 mb-3">
              {plan.athleteName && <span className="text-white/60">Athlete: <span className="text-white/80">{plan.athleteName}</span></span>}
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{plan.duration} min</span>
              {plan.sessionDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(plan.sessionDate).toLocaleDateString()}</span>}
            </div>
            {focusAreas.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {focusAreas.map((area) => (
                  <span key={area} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/[0.06] text-white/50">{area}</span>
                ))}
              </div>
            )}
          </div>
          <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowActions(!showActions)} className="p-2 rounded-lg hover:bg-white/[0.1] text-white/40 hover:text-white/80 transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
            {showActions && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
                <div className="absolute right-0 top-10 z-50 bg-[#1a1f2e] border border-white/[0.1] rounded-xl shadow-2xl py-1 min-w-[160px]">
                  <button onClick={() => { onEdit(); setShowActions(false); }} className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/[0.06] flex items-center gap-2"><Edit3 className="h-3.5 w-3.5" /> Edit</button>
                  <button onClick={() => { onDuplicate(); setShowActions(false); }} className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/[0.06] flex items-center gap-2"><Copy className="h-3.5 w-3.5" /> Duplicate</button>
                  <button onClick={() => { onToggleShare(); setShowActions(false); }} className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/[0.06] flex items-center gap-2">
                    {plan.isShared ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {plan.isShared ? "Unshare" : "Share"}
                  </button>
                  <div className="border-t border-white/[0.06] my-1" />
                  <button onClick={() => { onDelete(); setShowActions(false); }} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Plan Detail View ────────────────────────────────────────────────────────

function PlanDetail({ planId, onBack, onEdit, onToggleShare }: {
  planId: number; onBack: () => void; onEdit: () => void; onToggleShare: (planId: number, currentlyShared: boolean) => void;
}) {
  const { data: plan, isLoading } = trpc.practicePlans.getById.useQuery({ planId });

  if (isLoading) return <div className="space-y-4"><div className="h-8 w-48 bg-white/[0.06] rounded animate-pulse" /><div className="h-64 bg-white/[0.04] rounded-xl animate-pulse" /></div>;
  if (!plan) return <div className="text-center py-16"><p className="text-white/50">Plan not found</p><Button variant="outline" onClick={onBack} className="mt-4">Go Back</Button></div>;

  const focusAreas = (plan.focusAreas as string[]) || [];
  const blocks = (plan as any).blocks || [];
  let runningTime = 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/[0.1] text-white/50 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-heading font-bold text-white truncate">{plan.title}</h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/40 mt-1">
            {plan.athleteName && <span>Athlete: <span className="text-white/70">{plan.athleteName}</span></span>}
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{plan.duration} min</span>
            {plan.sessionDate && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(plan.sessionDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onToggleShare(plan.id, !!plan.isShared)}
            className="bg-transparent border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.06] gap-1.5">
            {plan.isShared ? <EyeOff className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{plan.isShared ? "Unshare" : "Share"}</span>
          </Button>
          <Button size="sm" onClick={onEdit} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
            <Edit3 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Edit</span>
          </Button>
        </div>
      </div>

      {focusAreas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {focusAreas.map((area) => <Badge key={area} variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/20">{area}</Badge>)}
        </div>
      )}

      {plan.sessionNotes && (
        <Card className="bg-white/[0.04] border-white/[0.08]">
          <CardContent className="p-4">
            <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Session Notes</h4>
            <p className="text-sm text-white/70 whitespace-pre-wrap">{plan.sessionNotes}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">Session Timeline</h3>
        {blocks.length === 0 ? (
          <p className="text-sm text-white/30 italic">No blocks added yet.</p>
        ) : (
          <div className="space-y-2">
            {blocks.map((block: any, idx: number) => {
              const startTime = runningTime;
              runningTime += block.duration;
              const config = BLOCK_TYPE_CONFIG[block.blockType as keyof typeof BLOCK_TYPE_CONFIG] || BLOCK_TYPE_CONFIG.custom;
              const Icon = config.icon;
              return (
                <div key={block.id || idx} className={`rounded-xl border p-4 ${config.bg}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${config.bg}`}><Icon className={`h-4 w-4 ${config.color}`} /></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-white text-sm">{block.title}</h4>
                        <span className="text-xs text-white/40 whitespace-nowrap">{startTime}–{runningTime} min</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-white/40">
                        <span>{block.duration} min</span>
                        {block.sets && <span>{block.sets} sets</span>}
                        {block.reps && <span>{block.reps} reps</span>}
                      </div>
                      {block.notes && <p className="text-xs text-white/40 mt-2 italic">{block.notes}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white/[0.04] rounded-xl border border-white/[0.08] p-4 flex items-center justify-between">
        <span className="text-sm text-white/50">Total Session Duration</span>
        <span className="font-heading font-bold text-white text-lg">{plan.duration} min</span>
      </div>
    </div>
  );
}

// ─── Plan Form (Create / Edit) ──────────────────────────────────────────────

function PlanForm({ planId, athleteOptions, onCancel, onSave, isSaving }: {
  planId: number | null;
  athleteOptions: { id: string; name: string; email: string; type: "user" | "invite"; userId?: number; inviteId?: number }[];
  onCancel: () => void; onSave: (data: any) => void; isSaving: boolean;
}) {
  const { data: existingPlan, isLoading: loadingPlan } = trpc.practicePlans.getById.useQuery(
    { planId: planId! }, { enabled: !!planId }
  );

  const [title, setTitle] = useState("");
  const [selectedAthlete, setSelectedAthlete] = useState<string>("none");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [status, setStatus] = useState<"draft" | "scheduled" | "completed" | "cancelled">("draft");
  const [blocks, setBlocks] = useState<PlanBlock[]>([]);
  const [initialized, setInitialized] = useState(false);

  if (planId && existingPlan && !initialized) {
    setTitle(existingPlan.title);
    if (existingPlan.athleteId) setSelectedAthlete(`user-${existingPlan.athleteId}`);
    if (existingPlan.sessionDate) {
      const d = new Date(existingPlan.sessionDate);
      setSessionDate(d.toISOString().slice(0, 16));
    }
    setSessionNotes(existingPlan.sessionNotes || "");
    setFocusAreas((existingPlan.focusAreas as string[]) || []);
    setStatus(existingPlan.status as any);
    setBlocks(
      ((existingPlan as any).blocks || []).map((b: any) => ({
        id: tempId(), sortOrder: b.sortOrder, blockType: b.blockType, drillId: b.drillId,
        title: b.title, duration: b.duration, sets: b.sets, reps: b.reps, notes: b.notes,
      }))
    );
    setInitialized(true);
  }

  const totalDuration = blocks.reduce((sum, b) => sum + b.duration, 0);

  const toggleFocusArea = (area: string) => {
    setFocusAreas((prev) => prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]);
  };

  const addBlock = (type: PlanBlock["blockType"]) => {
    const defaultTitles: Record<string, string> = { drill: "New Drill", warmup: "Warm-Up", cooldown: "Cool-Down", break: "Break", custom: "Custom Activity" };
    setBlocks((prev) => [...prev, {
      id: tempId(), sortOrder: prev.length, blockType: type, title: defaultTitles[type],
      duration: type === "break" ? 5 : 10, drillId: null, sets: null, reps: null, notes: null,
    }]);
  };

  const updateBlock = (id: string, updates: Partial<PlanBlock>) => {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => { setBlocks((prev) => prev.filter((b) => b.id !== id)); };

  const moveBlock = (id: string, direction: "up" | "down") => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const athleteId = selectedAthlete.startsWith("user-") ? parseInt(selectedAthlete.replace("user-", "")) : null;
    onSave({
      title: title.trim(), athleteId, sessionDate: sessionDate || null,
      duration: totalDuration || 60, sessionNotes: sessionNotes || null,
      focusAreas: focusAreas.length > 0 ? focusAreas : null, status, isShared: false,
      blocks: blocks.map((b, i) => ({
        sortOrder: i, blockType: b.blockType, drillId: b.drillId || null,
        title: b.title, duration: b.duration, sets: b.sets || null, reps: b.reps || null, notes: b.notes || null,
      })),
    });
  };

  if (planId && loadingPlan) return <div className="space-y-4"><div className="h-8 w-48 bg-white/[0.06] rounded animate-pulse" /><div className="h-64 bg-white/[0.04] rounded-xl animate-pulse" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-white/[0.1] text-white/50 hover:text-white transition-colors"><ArrowLeft className="h-5 w-5" /></button>
        <h2 className="text-2xl font-heading font-bold text-white">{planId ? "Edit Plan" : "New Practice Plan"}</h2>
      </div>

      <Card className="bg-white/[0.04] border-white/[0.08]">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 block">Plan Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Hitting Mechanics - Joey T"
              className="bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 text-lg font-medium" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 block">Athlete</label>
              <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
                <SelectTrigger className="bg-white/[0.06] border-white/[0.08] text-white"><SelectValue placeholder="Select athlete (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific athlete</SelectItem>
                  {athleteOptions.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} ({a.email})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 block">Session Date</label>
              <Input type="datetime-local" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)}
                className="bg-white/[0.06] border-white/[0.08] text-white" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 block">Status</label>
            <div className="flex flex-wrap gap-2">
              {(["draft", "scheduled", "completed", "cancelled"] as const).map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${status === s ? "bg-blue-600 text-white" : "bg-white/[0.06] text-white/50 hover:text-white/80"}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 block">Focus Areas</label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_AREAS.map((area) => (
                <button key={area} onClick={() => toggleFocusArea(area)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${focusAreas.includes(area) ? "bg-blue-600 text-white" : "bg-white/[0.06] text-white/50 hover:text-white/80"}`}>
                  {area}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 block">Session Notes</label>
            <Textarea value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Pre-session notes, goals, things to focus on..." rows={3}
              className="bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 resize-none" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">Session Blocks ({blocks.length})</h3>
          <div className="flex items-center gap-2 text-sm text-white/40"><Clock className="h-3.5 w-3.5" />{totalDuration} min total</div>
        </div>

        {blocks.map((block, idx) => (
          <BlockEditor key={block.id} block={block} index={idx} total={blocks.length}
            onUpdate={(updates) => updateBlock(block.id, updates)} onRemove={() => removeBlock(block.id)}
            onMoveUp={() => moveBlock(block.id, "up")} onMoveDown={() => moveBlock(block.id, "down")} />
        ))}

        <div className="flex flex-wrap gap-2 pt-2">
          {(Object.keys(BLOCK_TYPE_CONFIG) as Array<keyof typeof BLOCK_TYPE_CONFIG>).map((type) => {
            const config = BLOCK_TYPE_CONFIG[type];
            const Icon = config.icon;
            return (
              <button key={type} onClick={() => addBlock(type)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all hover:scale-[1.02] ${config.bg} ${config.color}`}>
                <Icon className="h-3.5 w-3.5" /> {config.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sticky bottom-0 bg-[#0d1117]/95 backdrop-blur-lg border-t border-white/[0.08] -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 flex items-center justify-between gap-4 z-10">
        <Button variant="outline" onClick={onCancel} className="bg-transparent border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.06]">Cancel</Button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/40 hidden sm:inline">{blocks.length} blocks · {totalDuration} min</span>
          <Button onClick={handleSubmit} disabled={!title.trim() || isSaving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 min-w-[120px]">
            {isSaving ? <span className="animate-pulse">Saving...</span> : <><Check className="h-4 w-4" />{planId ? "Save Changes" : "Create Plan"}</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Block Editor ────────────────────────────────────────────────────────────

function BlockEditor({ block, index, total, onUpdate, onRemove, onMoveUp, onMoveDown }: {
  block: PlanBlock; index: number; total: number;
  onUpdate: (updates: Partial<PlanBlock>) => void; onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const config = BLOCK_TYPE_CONFIG[block.blockType] || BLOCK_TYPE_CONFIG.custom;
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border transition-all ${config.bg}`}>
      <div className="flex items-center gap-2 p-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex flex-col gap-0.5 text-white/20">
          <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={index === 0} className="hover:text-white/60 disabled:opacity-20"><ChevronUp className="h-3.5 w-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={index === total - 1} className="hover:text-white/60 disabled:opacity-20"><ChevronDown className="h-3.5 w-3.5" /></button>
        </div>
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}><Icon className={`h-4 w-4 ${config.color}`} /></div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-white truncate block">{block.title}</span>
          <span className="text-[10px] text-white/30">{block.duration} min</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
        {expanded ? <ChevronUp className="h-4 w-4 text-white/20" /> : <ChevronDown className="h-4 w-4 text-white/20" />}
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-white/[0.06] pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <div>
              <label className="text-[10px] font-medium text-white/30 uppercase mb-1 block">Title</label>
              <Input value={block.title} onChange={(e) => onUpdate({ title: e.target.value })} className="bg-white/[0.06] border-white/[0.06] text-white text-sm h-9" />
            </div>
            <div className="w-24">
              <label className="text-[10px] font-medium text-white/30 uppercase mb-1 block">Minutes</label>
              <Input type="number" min={1} value={block.duration} onChange={(e) => onUpdate({ duration: parseInt(e.target.value) || 1 })} className="bg-white/[0.06] border-white/[0.06] text-white text-sm h-9" />
            </div>
          </div>

          {block.blockType === "drill" && (
            <div>
              <label className="text-[10px] font-medium text-white/30 uppercase mb-1 block">Drill from Library</label>
              <DrillPickerButton currentDrillId={block.drillId || null} onSelect={(drill) => onUpdate({ drillId: drill.id, title: drill.name })} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-white/30 uppercase mb-1 block">Sets</label>
              <Input type="number" min={0} value={block.sets || ""} onChange={(e) => onUpdate({ sets: parseInt(e.target.value) || null })} placeholder="—" className="bg-white/[0.06] border-white/[0.06] text-white text-sm h-9" />
            </div>
            <div>
              <label className="text-[10px] font-medium text-white/30 uppercase mb-1 block">Reps</label>
              <Input type="number" min={0} value={block.reps || ""} onChange={(e) => onUpdate({ reps: parseInt(e.target.value) || null })} placeholder="—" className="bg-white/[0.06] border-white/[0.06] text-white text-sm h-9" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium text-white/30 uppercase mb-1 block">Notes</label>
            <Textarea value={block.notes || ""} onChange={(e) => onUpdate({ notes: e.target.value || null })}
              placeholder="Coaching cues, reminders..." rows={2} className="bg-white/[0.06] border-white/[0.06] text-white text-sm resize-none placeholder:text-white/20" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Drill Picker Button ─────────────────────────────────────────────────────

function DrillPickerButton({ currentDrillId, onSelect }: { currentDrillId: string | null; onSelect: (drill: DrillItem) => void; }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const currentDrill = currentDrillId ? (drillsData as DrillItem[]).find((d) => d.id === currentDrillId) : null;

  const filtered = useMemo(() => {
    if (!search) return (drillsData as DrillItem[]).slice(0, 20);
    return (drillsData as DrillItem[]).filter((d) => d.name.toLowerCase().includes(search.toLowerCase())).slice(0, 20);
  }, [search]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/[0.06] text-left hover:bg-white/[0.08] transition-colors">
          <BookOpen className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
          <span className={`text-sm truncate ${currentDrill ? "text-white" : "text-white/30"}`}>{currentDrill ? currentDrill.name : "Select from drill library..."}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1f2e] border-white/[0.1] text-white max-w-md max-h-[80vh]">
        <DialogHeader><DialogTitle className="font-heading text-white">Drill Library</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search drills..."
              className="pl-9 bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/30" autoFocus />
          </div>
          <div className="max-h-[50vh] overflow-y-auto space-y-1">
            {filtered.map((drill) => (
              <button key={drill.id} onClick={() => { onSelect(drill); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between gap-2 ${currentDrillId === drill.id ? "bg-blue-600/20 text-blue-300" : "hover:bg-white/[0.06] text-white/70"}`}>
                <div className="min-w-0">
                  <span className="text-sm font-medium block truncate">{drill.name}</span>
                  <span className="text-[10px] text-white/30">{drill.difficulty} · {drill.duration} · {drill.categories.join(", ")}</span>
                </div>
                {currentDrillId === drill.id && <Check className="h-4 w-4 text-blue-400 flex-shrink-0" />}
              </button>
            ))}
            {filtered.length === 0 && <p className="text-sm text-white/30 text-center py-4">No drills found</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
