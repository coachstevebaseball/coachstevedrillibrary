import { useState, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search, Plus, Eye, EyeOff, Trash2, Pencil, Save, X,
  Upload, Download, ChevronDown, ChevronUp, RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { filterOptions } from "@/data/drillConstants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DrillRow {
  id: number;
  drillId: string;
  name: string;
  difficulty: string;
  categories: string[];
  duration: string;
  url: string | null;
  isDirectLink: boolean;
  ageLevel: string[] | null;
  tags: string[] | null;
  problem: string[] | null;
  goal: string[] | null;
  drillType: string | null;
  problems: string[] | null;
  outcomes: string[] | null;
  source: string;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
  // 8 rich coaching fields
  goalOfDrill: string | null;
  whoThisDrillIsBestFor: string | null;
  coachingNotes: string[] | null;
  whatThisDrillHelpsFix: string[] | null;
  howToRunTheDrill: string[] | null;
  commonMistakes: string[] | null;
  coachSteveCue: string | null;
  gameTransferExplanation: string | null;
}

interface EditState {
  drillId: string;
  name: string;
  difficulty: string;
  categories: string;
  duration: string;
  url: string;
  problems: string;
  outcomes: string;
  tags: string;
  problem: string;
  goal: string;
  drillType: string;
  isHidden: boolean;
  // 8 rich coaching fields
  goalOfDrill: string;
  whoThisDrillIsBestFor: string;
  coachingNotes: string;
  whatThisDrillHelpsFix: string;
  howToRunTheDrill: string;
  commonMistakes: string;
  coachSteveCue: string;
  gameTransferExplanation: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseJsonArr(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  // Try JSON parse first
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch (_) {}
  // Fall back to comma-separated
  return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
}

function arrToDisplay(arr: string[] | null | undefined): string {
  if (!arr || arr.length === 0) return "";
  return arr.join(", ");
}

function difficultyColor(d: string) {
  if (d === "Easy") return "bg-green-900/40 text-green-400 border-green-700";
  if (d === "Hard") return "bg-red-900/40 text-red-400 border-red-700";
  return "bg-yellow-900/40 text-yellow-400 border-yellow-700";
}

// ─── Bulk Import Parser ───────────────────────────────────────────────────────

interface BulkRow {
  drillId: string;
  name?: string;
  difficulty?: string;
  categories?: string;
  duration?: string;
  url?: string;
  ageLevel?: string;
  drillType?: string;
  problems?: string;
  outcomes?: string;
  tags?: string;
  problem?: string;
  goal?: string;
}

function parseBulkCSV(raw: string): BulkRow[] {
  const lines = raw.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
  return lines.slice(1).map((line) => {
    // Handle quoted commas
    const cols: string[] = [];
    let cur = "";
    let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { cols.push(cur); cur = ""; continue; }
      cur += ch;
    }
    cols.push(cur);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = (cols[i] ?? "").trim(); });
      // Map lowercase 'drillid' key back to 'drillId'
      if (row['drillid'] && !row['drillId']) row['drillId'] = row['drillid'];
      return row as unknown as BulkRow;
  }).filter((r) => !!r.drillId);
}

function parseBulkJSON(raw: string): BulkRow[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (_) {
    return [];
  }
}

// ─── Edit Row Modal ───────────────────────────────────────────────────────────

function EditDrillModal({
  drill,
  onClose,
  onSaved,
}: {
  drill: DrillRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState<EditState>({
    drillId: drill.drillId,
    name: drill.name,
    difficulty: drill.difficulty,
    categories: arrToDisplay(drill.categories),
    duration: drill.duration,
    url: drill.url ?? "",
    problems: arrToDisplay(drill.problems),
    outcomes: arrToDisplay(drill.outcomes),
    tags: arrToDisplay(drill.tags),
    problem: arrToDisplay(drill.problem),
    goal: arrToDisplay(drill.goal),
    drillType: drill.drillType ?? "",
    isHidden: drill.isHidden,
    goalOfDrill: drill.goalOfDrill ?? "",
    whoThisDrillIsBestFor: drill.whoThisDrillIsBestFor ?? "",
    coachingNotes: arrToDisplay(drill.coachingNotes),
    whatThisDrillHelpsFix: arrToDisplay(drill.whatThisDrillHelpsFix),
    howToRunTheDrill: arrToDisplay(drill.howToRunTheDrill),
    commonMistakes: arrToDisplay(drill.commonMistakes),
    coachSteveCue: drill.coachSteveCue ?? "",
    gameTransferExplanation: drill.gameTransferExplanation ?? "",
  });

  const upsert = trpc.drillsDirectory.upsert.useMutation({
    onSuccess: () => {
      toast.success(`Drill saved: ${form.name}`);
      utils.drillsDirectory.listAdmin.invalidate();
      utils.drillsDirectory.list.invalidate();
      onSaved();
    },
    onError: (e) => toast.error(`Save failed: ${e.message}`),
  });

  function set(field: keyof EditState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    upsert.mutate({
      drillId: form.drillId,
      name: form.name,
      difficulty: (form.difficulty || 'Medium') as 'Easy' | 'Medium' | 'Hard',
      categories: parseJsonArr(form.categories),
      duration: form.duration,
      url: form.url || null,
      isDirectLink: drill.isDirectLink,
      problems: parseJsonArr(form.problems),
      outcomes: parseJsonArr(form.outcomes),
      tags: parseJsonArr(form.tags),
      problem: parseJsonArr(form.problem),
      goal: parseJsonArr(form.goal),
      drillType: form.drillType || null,
      source: drill.source as "static" | "custom",
      isHidden: form.isHidden,
      goalOfDrill: form.goalOfDrill || null,
      whoThisDrillIsBestFor: form.whoThisDrillIsBestFor || null,
      coachingNotes: parseJsonArr(form.coachingNotes).length ? parseJsonArr(form.coachingNotes) : null,
      whatThisDrillHelpsFix: parseJsonArr(form.whatThisDrillHelpsFix).length ? parseJsonArr(form.whatThisDrillHelpsFix) : null,
      howToRunTheDrill: parseJsonArr(form.howToRunTheDrill).length ? parseJsonArr(form.howToRunTheDrill) : null,
      commonMistakes: parseJsonArr(form.commonMistakes).length ? parseJsonArr(form.commonMistakes) : null,
      coachSteveCue: form.coachSteveCue || null,
      gameTransferExplanation: form.gameTransferExplanation || null,
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#0f1419] border-[#1e2a3a] text-gray-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white font-bold">Edit Drill</DialogTitle>
          <DialogDescription className="text-gray-400 text-xs font-mono">{drill.drillId}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-2">
          {/* Name */}
          <div className="col-span-2">
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Name</label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="bg-[#0A1628] border-[#1e2a3a] text-white"
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Difficulty</label>
            <Select value={form.difficulty} onValueChange={(v) => set("difficulty", v)}>
              <SelectTrigger className="bg-[#0A1628] border-[#1e2a3a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0A1628] border-[#1e2a3a]">
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Duration</label>
            <Input
              value={form.duration}
              onChange={(e) => set("duration", e.target.value)}
              placeholder="e.g. 10m"
              className="bg-[#0A1628] border-[#1e2a3a] text-white"
            />
          </div>

          {/* Categories */}
          <div className="col-span-2">
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">
              Categories <span className="text-gray-600 normal-case">(comma-separated)</span>
            </label>
            <Input
              value={form.categories}
              onChange={(e) => set("categories", e.target.value)}
              placeholder="Hitting, Bunting"
              className="bg-[#0A1628] border-[#1e2a3a] text-white"
            />
          </div>

          {/* URL */}
          <div className="col-span-2">
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Source URL</label>
            <Input
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://..."
              className="bg-[#0A1628] border-[#1e2a3a] text-white"
            />
          </div>

          {/* Problems (canonical) */}
          <div className="col-span-2">
            <label className="text-xs text-[#e4002b] uppercase tracking-wider mb-1 block">
              Problems[] <span className="text-gray-600 normal-case">(display labels, comma-separated)</span>
            </label>
            <Input
              value={form.problems}
              onChange={(e) => set("problems", e.target.value)}
              placeholder="Timing Issues, Bat Path Issues"
              className="bg-[#0A1628] border-[#1e2a3a] text-white"
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {filterOptions.problems.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    const arr = parseJsonArr(form.problems);
                    const next = arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p];
                    set("problems", next.join(", "));
                  }}
                  className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                    parseJsonArr(form.problems).includes(p)
                      ? "bg-[#e4002b] border-[#e4002b] text-white"
                      : "bg-transparent border-[#1e2a3a] text-gray-400 hover:border-[#e4002b]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Outcomes (canonical) */}
          <div className="col-span-2">
            <label className="text-xs text-[#e4002b] uppercase tracking-wider mb-1 block">
              Outcomes[] <span className="text-gray-600 normal-case">(display labels, comma-separated)</span>
            </label>
            <Input
              value={form.outcomes}
              onChange={(e) => set("outcomes", e.target.value)}
              placeholder="Improve Barrel Path, Increase Bat Speed"
              className="bg-[#0A1628] border-[#1e2a3a] text-white"
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {filterOptions.outcomes.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => {
                    const arr = parseJsonArr(form.outcomes);
                    const next = arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o];
                    set("outcomes", next.join(", "));
                  }}
                  className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                    parseJsonArr(form.outcomes).includes(o)
                      ? "bg-[#e4002b] border-[#e4002b] text-white"
                      : "bg-transparent border-[#1e2a3a] text-gray-400 hover:border-[#e4002b]"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="col-span-2">
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">
              Focus Tags <span className="text-gray-600 normal-case">(comma-separated)</span>
            </label>
            <Input
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="bat speed, timing, balance"
              className="bg-[#0A1628] border-[#1e2a3a] text-white"
            />
          </div>

          {/* Drill Type */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Drill Type</label>
            <Input
              value={form.drillType}
              onChange={(e) => set("drillType", e.target.value)}
              placeholder="Tee Work, Front Toss…"
              className="bg-[#0A1628] border-[#1e2a3a] text-white"
            />
          </div>

          {/* ── Rich Coaching Fields ──────────────────────────────── */}
          <div className="col-span-2 border-t border-[#1e2a3a] pt-4 mt-2">
            <h4 className="text-xs text-yellow-400 uppercase tracking-wider mb-3 font-semibold">Rich Coaching Content</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Goal of Drill</label>
                <Input
                  value={form.goalOfDrill}
                  onChange={(e) => set("goalOfDrill", e.target.value)}
                  placeholder="e.g. Develop hip rotation through the zone"
                  className="bg-[#0A1628] border-[#1e2a3a] text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Who This Drill Is Best For</label>
                <Input
                  value={form.whoThisDrillIsBestFor}
                  onChange={(e) => set("whoThisDrillIsBestFor", e.target.value)}
                  placeholder="e.g. Hitters who cast the barrel early"
                  className="bg-[#0A1628] border-[#1e2a3a] text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Coach Steve's Cue</label>
                <Input
                  value={form.coachSteveCue}
                  onChange={(e) => set("coachSteveCue", e.target.value)}
                  placeholder="e.g. 'Knob to the ball, barrel follows'"
                  className="bg-[#0A1628] border-[#1e2a3a] text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Game Transfer Explanation</label>
                <Textarea
                  value={form.gameTransferExplanation}
                  onChange={(e) => set("gameTransferExplanation", e.target.value)}
                  placeholder="How this drill translates to in-game situations..."
                  className="bg-[#0A1628] border-[#1e2a3a] text-white min-h-[80px]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Coaching Notes (one per line)</label>
                <Textarea
                  value={form.coachingNotes}
                  onChange={(e) => set("coachingNotes", e.target.value)}
                  placeholder="Key coaching points, one per line..."
                  className="bg-[#0A1628] border-[#1e2a3a] text-white min-h-[80px]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">What This Drill Helps Fix (one per line)</label>
                <Textarea
                  value={form.whatThisDrillHelpsFix}
                  onChange={(e) => set("whatThisDrillHelpsFix", e.target.value)}
                  placeholder="e.g. Casting the barrel\nDropping the back shoulder"
                  className="bg-[#0A1628] border-[#1e2a3a] text-white min-h-[80px]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">How to Run the Drill (one step per line)</label>
                <Textarea
                  value={form.howToRunTheDrill}
                  onChange={(e) => set("howToRunTheDrill", e.target.value)}
                  placeholder="Step 1: Set up the tee at middle-in...\nStep 2: ..."
                  className="bg-[#0A1628] border-[#1e2a3a] text-white min-h-[100px]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Common Mistakes (one per line)</label>
                <Textarea
                  value={form.commonMistakes}
                  onChange={(e) => set("commonMistakes", e.target.value)}
                  placeholder="e.g. Rushing the load\nNot staying back on off-speed"
                  className="bg-[#0A1628] border-[#1e2a3a] text-white min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* Hidden toggle */}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => set("isHidden", !form.isHidden)}
              className={`flex items-center gap-2 px-3 py-2 rounded border text-sm transition-colors ${
                form.isHidden
                  ? "bg-red-900/30 border-red-700 text-red-400"
                  : "bg-green-900/30 border-green-700 text-green-400"
              }`}
            >
              {form.isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {form.isHidden ? "Hidden" : "Visible"}
            </button>
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={onClose} className="border-[#1e2a3a] text-gray-400">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={upsert.isPending}
            className="bg-[#e4002b] hover:bg-[#c0001f] text-white"
          >
            {upsert.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bulk Import Modal ────────────────────────────────────────────────────────

// Full field template for new drill creation
const FULL_CSV_TEMPLATE = `drillId,name,difficulty,categories,duration,url,ageLevel,drillType,problems,outcomes,tags
new-drill-example,My New Drill,Medium,"Hitting",10m,https://example.com/drill,"Youth,High School",Constraint,"Timing Issues, Poor Load","Improve Timing, Improve Barrel Path","timing, rhythm"
existing-drill-id,,,,,,,,"Bat Path Issues",,`;

const FULL_JSON_TEMPLATE = JSON.stringify([
  {
    drillId: "new-drill-example",
    name: "My New Drill",
    difficulty: "Medium",
    categories: ["Hitting"],
    duration: "10m",
    url: "https://example.com/drill",
    ageLevel: ["Youth", "High School"],
    drillType: "Constraint",
    problems: ["Timing Issues", "Poor Load"],
    outcomes: ["Improve Timing", "Improve Barrel Path"],
    tags: ["timing", "rhythm"]
  },
  {
    drillId: "existing-drill-id",
    problems: ["Bat Path Issues"]
  }
], null, 2);

function BulkImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const utils = trpc.useUtils();
  const [raw, setRaw] = useState("");
  const [format, setFormat] = useState<"csv" | "json">("json");
  const [preview, setPreview] = useState<BulkRow[]>([]);
  const [parsed, setParsed] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; updated: number; skipped: number; errors: Array<{ drillId: string; reason: string }> } | null>(null);

  const bulkUpsert = trpc.drillsDirectory.bulkUpsert.useMutation({
    onSuccess: (res) => {
      setImportResult(res);
      const parts = [];
      if (res.created > 0) parts.push(`${res.created} new drills created`);
      if (res.updated > 0) parts.push(`${res.updated} drills updated`);
      if (res.skipped > 0) parts.push(`${res.skipped} rows skipped`);
      toast.success(`Import complete: ${parts.join(', ') || 'nothing changed'}`);
      utils.drillsDirectory.listAdmin.invalidate();
      utils.drillsDirectory.list.invalidate();
    },
    onError: (e: { message: string }) => toast.error(`Bulk import failed: ${e.message}`),
  });

  function handleParse() {
    const rows = format === "csv" ? parseBulkCSV(raw) : parseBulkJSON(raw);
    setPreview(rows);
    setParsed(true);
    setImportResult(null);
  }

  function handleImport() {
    const rows = preview.map((r) => ({
      drillId: (r.drillId ?? "").trim(),
      name: r.name || undefined,
      difficulty: (r.difficulty || undefined) as 'Easy' | 'Medium' | 'Hard' | undefined,
      categories: r.categories ? parseJsonArr(r.categories) : undefined,
      duration: r.duration || undefined,
      url: r.url || undefined,
      ageLevel: r.ageLevel ? parseJsonArr(r.ageLevel) : undefined,
      drillType: r.drillType || undefined,
      problems: r.problems ? parseJsonArr(r.problems) : undefined,
      outcomes: r.outcomes ? parseJsonArr(r.outcomes) : undefined,
      tags: r.tags ? parseJsonArr(r.tags) : undefined,
      problem: r.problem ? parseJsonArr(r.problem) : undefined,
      goal: r.goal ? parseJsonArr(r.goal) : undefined,
    }));
    bulkUpsert.mutate({ rows });
  }

  function downloadTemplate(fmt: 'csv' | 'json') {
    const content = fmt === 'csv' ? FULL_CSV_TEMPLATE : FULL_JSON_TEMPLATE;
    const blob = new Blob([content], { type: fmt === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drill-import-template.${fmt}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-[#0f1419] border-[#1e2a3a] text-gray-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white font-bold">Bulk Import / Create & Update Drills</DialogTitle>
          <DialogDescription className="text-gray-400">
            Paste CSV or JSON to <strong className="text-gray-200">create new drills or update existing ones</strong> in one shot.
            New drills are inserted; existing drills (matched by drillId) are updated with only the fields you provide.
          </DialogDescription>
        </DialogHeader>

        {/* Format toggle + template buttons */}
        <div className="flex flex-wrap gap-2 mt-2 items-center">
          {(["csv", "json"] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFormat(f); setParsed(false); }}
              className={`px-3 py-1 rounded text-sm font-mono border transition-colors ${
                format === f
                  ? "bg-[#e4002b] border-[#e4002b] text-white"
                  : "bg-transparent border-[#1e2a3a] text-gray-400"
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
          <div className="ml-auto flex gap-3">
            <button
              onClick={() => { setRaw(format === 'csv' ? FULL_CSV_TEMPLATE : FULL_JSON_TEMPLATE); setParsed(false); }}
              className="text-xs text-gray-500 hover:text-gray-300 underline"
            >
              Load {format.toUpperCase()} template
            </button>
            <button
              onClick={() => downloadTemplate(format)}
              className="text-xs text-[#e4002b] hover:text-[#ff3355] underline"
            >
              ↓ Download template
            </button>
          </div>
        </div>

        {/* Field reference */}
        <div className="bg-[#0A1628] border border-[#1e2a3a] rounded p-3 text-xs text-gray-400">
          <p className="font-semibold text-gray-300 mb-1">Accepted fields:</p>
          <p><span className="text-[#e4002b] font-mono">drillId</span> (required) · <span className="text-yellow-400 font-mono">name</span> (required for new drills) · difficulty · categories · duration · url · ageLevel · drillType · problems · outcomes · tags</p>
          <p className="mt-1 text-gray-500">Arrays: use JSON array syntax <code>["A","B"]</code> or comma-separated string <code>"A, B"</code> in CSV.</p>
        </div>

        <textarea
          value={raw}
          onChange={(e) => { setRaw(e.target.value); setParsed(false); setImportResult(null); }}
          rows={8}
          placeholder={format === "csv" ? "Paste CSV here…" : "Paste JSON array here…"}
          className="w-full bg-[#0A1628] border border-[#1e2a3a] rounded p-3 text-sm font-mono text-gray-200 resize-y focus:outline-none focus:border-[#e4002b]"
        />

        {/* Preview */}
        {parsed && preview.length > 0 && !importResult && (
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-2">{preview.length} rows parsed — preview (first 5):</p>
            <div className="overflow-x-auto rounded border border-[#1e2a3a]">
              <table className="text-xs w-full">
                <thead className="bg-[#0A1628]">
                  <tr>
                    {["drillId", "name", "difficulty", "problems", "outcomes"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-gray-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-t border-[#1e2a3a]">
                      <td className="px-3 py-1.5 font-mono text-gray-300">{r.drillId}</td>
                      <td className="px-3 py-1.5 text-gray-200">{r.name || <span className="text-gray-600 italic">update only</span>}</td>
                      <td className="px-3 py-1.5 text-gray-400">{r.difficulty || "—"}</td>
                      <td className="px-3 py-1.5 text-gray-400 max-w-[160px] truncate">{r.problems || "—"}</td>
                      <td className="px-3 py-1.5 text-gray-400 max-w-[160px] truncate">{r.outcomes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {parsed && preview.length === 0 && (
          <p className="text-red-400 text-sm mt-2">No valid rows found. Check your format and that drillId column exists.</p>
        )}

        {/* Import result summary */}
        {importResult && (
          <div className="mt-3 p-3 rounded border border-[#1e2a3a] bg-[#0A1628] space-y-2">
            <div className="flex gap-4 text-sm">
              <span className="text-green-400 font-semibold">✓ {importResult.created} created</span>
              <span className="text-blue-400 font-semibold">↑ {importResult.updated} updated</span>
              {importResult.skipped > 0 && <span className="text-yellow-400 font-semibold">⚠ {importResult.skipped} skipped</span>}
            </div>
            {importResult.errors.length > 0 && (
              <div className="text-xs text-gray-400">
                <p className="text-yellow-300 font-medium mb-1">Skipped rows:</p>
                {importResult.errors.map((e, i) => (
                  <p key={i}><span className="font-mono text-gray-300">{e.drillId}</span>: {e.reason}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={onClose} className="border-[#1e2a3a] text-gray-400">
            {importResult ? 'Close' : 'Cancel'}
          </Button>
          {!importResult && (
            !parsed ? (
              <Button onClick={handleParse} className="bg-[#0A1628] border border-[#1e2a3a] text-white hover:bg-[#1e2a3a]">
                Parse & Preview
              </Button>
            ) : (
              <Button
                onClick={handleImport}
                disabled={preview.length === 0 || bulkUpsert.isPending}
                className="bg-[#e4002b] hover:bg-[#c0001f] text-white"
              >
                {bulkUpsert.isPending
                  ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Importing…</>
                  : <><Upload className="h-4 w-4 mr-2" />Import {preview.length} rows</>}
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── New Drill Modal ──────────────────────────────────────────────────────────

function NewDrillModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    drillId: "",
    name: "",
    difficulty: "Medium",
    categories: "Hitting",
    duration: "10m",
    url: "",
    problems: "",
    outcomes: "",
    tags: "",
  });

  const upsert = trpc.drillsDirectory.upsert.useMutation({
    onSuccess: () => {
      toast.success(`Drill created: ${form.name}`);
      utils.drillsDirectory.listAdmin.invalidate();
      utils.drillsDirectory.list.invalidate();
      onSaved();
    },
    onError: (e: { message: string }) => toast.error(`Create failed: ${e.message}`),
  });

  function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleCreate() {
    const id = form.drillId || slugify(form.name);
    upsert.mutate({
      drillId: id,
      name: form.name,
      difficulty: (form.difficulty || 'Medium') as 'Easy' | 'Medium' | 'Hard',
      categories: parseJsonArr(form.categories),
      duration: form.duration,
      url: form.url || null,
      isDirectLink: false,
      problems: parseJsonArr(form.problems),
      outcomes: parseJsonArr(form.outcomes),
      tags: parseJsonArr(form.tags),
      source: "custom",
      isHidden: false,
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#0f1419] border-[#1e2a3a] text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-white font-bold">New Drill</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 mt-2">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Name *</label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="bg-[#0A1628] border-[#1e2a3a] text-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Difficulty</label>
              <Select value={form.difficulty} onValueChange={(v) => set("difficulty", v)}>
                <SelectTrigger className="bg-[#0A1628] border-[#1e2a3a] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0A1628] border-[#1e2a3a]">
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Duration</label>
              <Input value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="10m" className="bg-[#0A1628] border-[#1e2a3a] text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Categories (comma-separated)</label>
            <Input value={form.categories} onChange={(e) => set("categories", e.target.value)} placeholder="Hitting" className="bg-[#0A1628] border-[#1e2a3a] text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Source URL</label>
            <Input value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://..." className="bg-[#0A1628] border-[#1e2a3a] text-white" />
          </div>
          <div>
            <label className="text-xs text-[#e4002b] uppercase tracking-wider mb-1 block">Problems (comma-separated)</label>
            <Input value={form.problems} onChange={(e) => set("problems", e.target.value)} placeholder="Timing Issues, Bat Path Issues" className="bg-[#0A1628] border-[#1e2a3a] text-white" />
          </div>
          <div>
            <label className="text-xs text-[#e4002b] uppercase tracking-wider mb-1 block">Outcomes (comma-separated)</label>
            <Input value={form.outcomes} onChange={(e) => set("outcomes", e.target.value)} placeholder="Improve Barrel Path" className="bg-[#0A1628] border-[#1e2a3a] text-white" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Custom Drill ID (optional, auto-generated from name)</label>
            <Input value={form.drillId} onChange={(e) => set("drillId", e.target.value)} placeholder="auto" className="bg-[#0A1628] border-[#1e2a3a] text-white font-mono text-sm" />
          </div>
        </div>
        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={onClose} className="border-[#1e2a3a] text-gray-400">Cancel</Button>
          <Button onClick={handleCreate} disabled={!form.name || upsert.isPending} className="bg-[#e4002b] hover:bg-[#c0001f] text-white">
            {upsert.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDrillEditor() {
  const utils = trpc.useUtils();

  const { data: drillsRaw = [], isLoading, refetch } = trpc.drillsDirectory.listAdmin.useQuery();
  const drills = drillsRaw as DrillRow[];

  const [search, setSearch] = useState("");
  const [showHidden, setShowHidden] = useState(true);
  const [sortField, setSortField] = useState<"name" | "difficulty" | "updatedAt">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editingDrill, setEditingDrill] = useState<DrillRow | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showNewDrill, setShowNewDrill] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DrillRow | null>(null);

  const hide = trpc.drillsDirectory.hide.useMutation({
    onSuccess: () => { utils.drillsDirectory.listAdmin.invalidate(); utils.drillsDirectory.list.invalidate(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const restore = trpc.drillsDirectory.restore.useMutation({
    onSuccess: () => { utils.drillsDirectory.listAdmin.invalidate(); utils.drillsDirectory.list.invalidate(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const deletePerm = trpc.drillsDirectory.deletePermanently.useMutation({
    onSuccess: () => {
      toast.success("Drill permanently deleted");
      utils.drillsDirectory.listAdmin.invalidate();
      utils.drillsDirectory.list.invalidate();
      setDeleteConfirm(null);
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    let rows = drills;
    if (!showHidden) rows = rows.filter((d) => !d.isHidden);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.drillId.toLowerCase().includes(q) ||
          (d.problems ?? []).some((p) => p.toLowerCase().includes(q)) ||
          (d.outcomes ?? []).some((o) => o.toLowerCase().includes(q))
      );
    }
    return [...rows].sort((a, b) => {
      let av: string, bv: string;
      if (sortField === "updatedAt") {
        av = new Date(a.updatedAt).toISOString();
        bv = new Date(b.updatedAt).toISOString();
      } else {
        av = (a[sortField] ?? "").toString().toLowerCase();
        bv = (b[sortField] ?? "").toString().toLowerCase();
      }
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [drills, search, showHidden, sortField, sortDir]);

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  function SortIcon({ field }: { field: typeof sortField }) {
    if (sortField !== field) return <ChevronDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3 text-[#e4002b]" /> : <ChevronDown className="h-3 w-3 text-[#e4002b]" />;
  }

  // Export current view as JSON
  function handleExport() {
    const data = filtered.map((d) => ({
      drillId: d.drillId,
      name: d.name,
      difficulty: d.difficulty,
      categories: d.categories,
      duration: d.duration,
      url: d.url,
      problems: d.problems,
      outcomes: d.outcomes,
      tags: d.tags,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "drills-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const visibleCount = drills.filter((d) => !d.isHidden).length;
  const hiddenCount = drills.filter((d) => d.isHidden).length;

  return (
    <div className="min-h-screen bg-[#060d16] text-gray-100">
      {/* Header */}
      <div className="border-b border-[#1e2a3a] bg-[#0A1628]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Drill Library Editor</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {visibleCount} visible · {hiddenCount} hidden · {drills.length} total
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="border-[#1e2a3a] text-gray-400 hover:text-white"
            >
              <Download className="h-4 w-4 mr-1.5" /> Export JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkImport(true)}
              className="border-[#1e2a3a] text-gray-400 hover:text-white"
            >
              <Upload className="h-4 w-4 mr-1.5" /> Bulk Import
            </Button>
            <Button
              size="sm"
              onClick={() => setShowNewDrill(true)}
              className="bg-[#e4002b] hover:bg-[#c0001f] text-white"
            >
              <Plus className="h-4 w-4 mr-1.5" /> New Drill
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, problem, outcome…"
            className="pl-9 bg-[#0A1628] border-[#1e2a3a] text-white placeholder:text-gray-600"
          />
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowHidden((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-sm transition-colors ${
              showHidden
                ? "bg-[#1e2a3a] border-[#2a3a4a] text-gray-300"
                : "bg-transparent border-[#1e2a3a] text-gray-500"
            }`}
          >
            {showHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {showHidden ? "Showing hidden" : "Hidden hidden"}
          </button>
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded border border-[#1e2a3a] text-gray-500 hover:text-gray-300 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 sm:ml-auto">{filtered.length} drills shown</p>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="rounded-lg border border-[#1e2a3a] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0A1628] border-b border-[#1e2a3a]">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs text-gray-400 font-medium cursor-pointer hover:text-white select-none"
                    onClick={() => toggleSort("name")}
                  >
                    <span className="flex items-center gap-1">Name <SortIcon field="name" /></span>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs text-gray-400 font-medium cursor-pointer hover:text-white select-none"
                    onClick={() => toggleSort("difficulty")}
                  >
                    <span className="flex items-center gap-1">Difficulty <SortIcon field="difficulty" /></span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Problems</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-400 font-medium">Outcomes</th>
                  <th
                    className="px-4 py-3 text-left text-xs text-gray-400 font-medium cursor-pointer hover:text-white select-none"
                    onClick={() => toggleSort("updatedAt")}
                  >
                    <span className="flex items-center gap-1">Updated <SortIcon field="updatedAt" /></span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-t border-[#1e2a3a]">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-[#1e2a3a] rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      No drills found
                    </td>
                  </tr>
                ) : (
                  filtered.map((drill) => (
                    <tr
                      key={drill.drillId}
                      className={`border-t border-[#1e2a3a] hover:bg-[#0A1628]/50 transition-colors ${
                        drill.isHidden ? "opacity-50" : ""
                      }`}
                    >
                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {drill.isHidden && (
                            <EyeOff className="h-3.5 w-3.5 text-gray-600 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-white leading-tight">{drill.name}</p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">{drill.drillId}</p>
                          </div>
                        </div>
                      </td>

                      {/* Difficulty */}
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${difficultyColor(drill.difficulty)}`}
                        >
                          {drill.difficulty}
                        </Badge>
                      </td>

                      {/* Problems */}
                      <td className="px-4 py-3 max-w-[200px]">
                        {(drill.problems ?? []).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {(drill.problems ?? []).slice(0, 3).map((p) => (
                              <span key={p} className="text-xs bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded">
                                {p}
                              </span>
                            ))}
                            {(drill.problems ?? []).length > 3 && (
                              <span className="text-xs text-gray-500">+{(drill.problems ?? []).length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600 italic">—</span>
                        )}
                      </td>

                      {/* Outcomes */}
                      <td className="px-4 py-3 max-w-[200px]">
                        {(drill.outcomes ?? []).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {(drill.outcomes ?? []).slice(0, 2).map((o) => (
                              <span key={o} className="text-xs bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded">
                                {o}
                              </span>
                            ))}
                            {(drill.outcomes ?? []).length > 2 && (
                              <span className="text-xs text-gray-500">+{(drill.outcomes ?? []).length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600 italic">—</span>
                        )}
                      </td>

                      {/* Updated */}
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(drill.updatedAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingDrill(drill)}
                            className="p-1.5 rounded hover:bg-[#1e2a3a] text-gray-400 hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {drill.isHidden ? (
                            <button
                              onClick={() => restore.mutate({ drillId: drill.drillId })}
                              className="p-1.5 rounded hover:bg-green-900/30 text-gray-400 hover:text-green-400 transition-colors"
                              title="Restore"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => hide.mutate({ drillId: drill.drillId })}
                              className="p-1.5 rounded hover:bg-yellow-900/30 text-gray-400 hover:text-yellow-400 transition-colors"
                              title="Hide"
                            >
                              <EyeOff className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteConfirm(drill)}
                            className="p-1.5 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete permanently"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {editingDrill && (
        <EditDrillModal
          drill={editingDrill}
          onClose={() => setEditingDrill(null)}
          onSaved={() => setEditingDrill(null)}
        />
      )}
      {showBulkImport && (
        <BulkImportModal
          onClose={() => setShowBulkImport(false)}
          onDone={() => setShowBulkImport(false)}
        />
      )}
      {showNewDrill && (
        <NewDrillModal
          onClose={() => setShowNewDrill(false)}
          onSaved={() => setShowNewDrill(false)}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <Dialog open onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="max-w-sm bg-[#0f1419] border-[#1e2a3a] text-gray-100">
            <DialogHeader>
              <DialogTitle className="text-white">Permanently Delete?</DialogTitle>
              <DialogDescription className="text-gray-400">
                This will permanently remove <span className="text-white font-medium">{deleteConfirm.name}</span> from the database. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="border-[#1e2a3a] text-gray-400">
                Cancel
              </Button>
              <Button
                onClick={() => deletePerm.mutate({ drillId: deleteConfirm.drillId })}
                disabled={deletePerm.isPending}
                className="bg-red-700 hover:bg-red-800 text-white"
              >
                {deletePerm.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
