import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Alias Mapping ───────────────────────────────────────────────────────────
// Accept both user-facing aliases AND DB column names; normalize to DB column.
const ALIAS_TO_DB: Record<string, string> = {
  shortdescription: "whoThisDrillIsBestFor",
  watchfor: "gameTransferExplanation",
  whattofeel: "coachingNotes",
  problemitsolves: "whatThisDrillHelpsFix",
  howtodoit: "howToRunTheDrill",
  coachstevescue: "coachSteveCue",
  // DB column names (lowercase) → themselves
  whothisdrillisbestfor: "whoThisDrillIsBestFor",
  gametransferexplanation: "gameTransferExplanation",
  coachingnotes: "coachingNotes",
  whatthisdrillhelpsfix: "whatThisDrillHelpsFix",
  howtorunthedrill: "howToRunTheDrill",
  coachstevecue: "coachSteveCue",
  goalofdrill: "goalOfDrill",
  commonmistakes: "commonMistakes",
  drillid: "drillId",
  drilltype: "drillType",
  agelevel: "ageLevel",
  isdirectlink: "isDirectLink",
  ishidden: "isHidden",
};

/** Normalize a key: check alias map (case-insensitive), else return as-is */
function normalizeKey(key: string): string {
  const lower = key.trim().toLowerCase().replace(/[_\- ]/g, "");
  return ALIAS_TO_DB[lower] ?? key.trim();
}

/** Normalize all keys in a row object */
function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[normalizeKey(k)] = v;
  }
  return out;
}

// ─── Array Parsing ───────────────────────────────────────────────────────────
// Accept: JSON array, pipe-separated, newline-separated, or comma-separated.

function parseFlexibleArray(val: string | string[] | undefined | null): string[] | undefined {
  if (val === undefined || val === null) return undefined;
  if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
  const trimmed = String(val).trim();
  if (!trimmed) return undefined;
  // JSON array
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((s: unknown) => String(s).trim()).filter(Boolean);
    } catch { /* fall through */ }
  }
  // Pipe-separated
  if (trimmed.includes("|")) {
    return trimmed.split("|").map(s => s.trim()).filter(Boolean);
  }
  // Newline-separated
  if (trimmed.includes("\n")) {
    return trimmed.split("\n").map(s => s.trim()).filter(Boolean);
  }
  // Comma-separated (fallback)
  return trimmed.split(",").map(s => s.trim()).filter(Boolean);
}

// ─── Boolean Parsing ─────────────────────────────────────────────────────────

function parseBooleanish(val: unknown): boolean | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "boolean") return val;
  const s = String(val).trim().toLowerCase();
  if (["true", "1", "yes"].includes(s)) return true;
  if (["false", "0", "no"].includes(s)) return false;
  return undefined;
}

// ─── CSV Parser ──────────────────────────────────────────────────────────────

function parseBulkCSV(raw: string): Record<string, unknown>[] {
  const lines = raw.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
  return lines.slice(1).map(line => {
    const cols: string[] = [];
    let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { cols.push(cur); cur = ""; continue; }
      cur += ch;
    }
    cols.push(cur);
    const row: Record<string, unknown> = {};
    headers.forEach((h, i) => { row[h] = (cols[i] ?? "").trim(); });
    return normalizeRow(row);
  }).filter(r => !!(r.drillId));
}

function parseBulkJSON(raw: string): Record<string, unknown>[] {
  try {
    const arr = JSON.parse(raw.trim());
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(r => r && typeof r === "object")
      .map(r => normalizeRow(r as Record<string, unknown>))
      .filter(r => !!(r.drillId));
  } catch { return []; }
}

// ─── Templates ───────────────────────────────────────────────────────────────

const JSON_TEMPLATE = JSON.stringify([
  {
    drillId: "example-drill",
    name: "Example Drill",
    difficulty: "Medium",
    duration: "10m",
    categories: ["Hitting"],
    url: "",
    ageLevel: "All Levels",
    drillType: "Tee Work",
    problems: ["Timing Issues", "Bat Path Issues"],
    outcomes: ["Improve Timing", "Better Contact Quality"],
    tags: ["timing", "bat path"],
    goalOfDrill: "Train hitters to stay on time with a deliberate load sequence.",
    shortDescription: "Helps hitters find a repeatable tempo at the plate.",
    coachStevesCue: "Own the load, own the move, then let the swing go",
    watchFor: "The hitter should stay centered and avoid drifting forward before launch.",
    whatToFeel: ["smooth weight transfer", "barrel staying through zone"],
    problemItSolves: ["Improper load", "Poor sequencing"],
    howToDoIt: ["Start with bat on shoulder", "Shift weight back on one", "Stride on two", "Plant and swing on three"],
    commonMistakes: ["Rushing each phase", "Drifting forward too early"],
    visible: true
  }
], null, 2);

const CSV_TEMPLATE = `drillId,name,difficulty,categories,duration,url,ageLevel,drillType,problems,outcomes,tags,goalOfDrill,shortDescription,coachStevesCue,watchFor,whatToFeel,problemItSolves,howToDoIt,commonMistakes,visible
example-drill,Example Drill,Medium,Hitting,10m,,All Levels,Tee Work,"Timing Issues|Bat Path Issues","Improve Timing|Better Contact Quality","timing|bat path",Train hitters to stay on time.,Helps hitters find a repeatable tempo.,Own the load own the move,Stay centered avoid drifting.,"smooth weight transfer|barrel staying through zone","Improper load|Poor sequencing","Start with bat on shoulder|Shift weight back|Stride|Plant and swing","Rushing each phase|Drifting forward",true`;

// ─── Field sets for mapping ──────────────────────────────────────────────────

const ARRAY_FIELDS = new Set([
  "categories", "ageLevel", "problems", "outcomes", "tags",
  "problem", "goal", "equipment",
  "coachingNotes", "whatThisDrillHelpsFix", "howToRunTheDrill", "commonMistakes",
]);

// ─── Component ────────────────────────────────────────────────────────────────

export function BulkImportDrills() {
  const utils = trpc.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState(false);
  const [preview, setPreview] = useState<Record<string, unknown>[]>([]);
  const [importResult, setImportResult] = useState<{
    created: number; updated: number; skipped: number;
    errors: Array<{ drillId: string; reason: string }>;
  } | null>(null);

  const bulkUpsert = trpc.drillsDirectory.bulkUpsert.useMutation({
    onSuccess: (res) => {
      setImportResult(res);
      const parts = [];
      if (res.created > 0) parts.push(`${res.created} new drills created`);
      if (res.updated > 0) parts.push(`${res.updated} drills updated`);
      if (res.skipped > 0) parts.push(`${res.skipped} rows skipped`);
      if (res.created > 0 || res.updated > 0) {
        toast.success(`Import complete: ${parts.join(", ")}`);
      } else {
        toast.warning(`Import complete: ${parts.join(", ") || "nothing changed"}`);
      }
      utils.drillsDirectory.listAdmin.invalidate();
      utils.drillsDirectory.list.invalidate();
    },
    onError: (e) => toast.error(`Import failed: ${e.message}`),
  });

  function handleParse() {
    const rows = format === "csv" ? parseBulkCSV(raw) : parseBulkJSON(raw);
    setPreview(rows);
    setParsed(true);
    setImportResult(null);
  }

  function handleImport() {
    const rows = preview.map((r) => {
      const drillId = String(r.drillId ?? "").trim();

      // Build the mutation payload
      const payload: Record<string, unknown> = { drillId };

      // Simple string fields
      if (r.name) payload.name = String(r.name);
      if (r.difficulty) payload.difficulty = String(r.difficulty) as 'Easy' | 'Medium' | 'Hard';
      if (r.duration) payload.duration = String(r.duration);
      if (r.url !== undefined && r.url !== "") payload.url = String(r.url);
      if (r.drillType) payload.drillType = String(r.drillType);
      if (r.description) payload.description = String(r.description);

      // Rich coaching string fields
      if (r.goalOfDrill) payload.goalOfDrill = String(r.goalOfDrill);
      if (r.whoThisDrillIsBestFor) payload.whoThisDrillIsBestFor = String(r.whoThisDrillIsBestFor);
      if (r.coachSteveCue) payload.coachSteveCue = String(r.coachSteveCue);
      if (r.gameTransferExplanation) payload.gameTransferExplanation = String(r.gameTransferExplanation);

      // Array fields — parse flexibly
      for (const field of ARRAY_FIELDS) {
        if (r[field] !== undefined && r[field] !== "" && r[field] !== null) {
          payload[field] = parseFlexibleArray(r[field] as string | string[]);
        }
      }

      // Visible → isHidden inversion
      const visibleVal = parseBooleanish(r.visible);
      const isHiddenVal = parseBooleanish(r.isHidden);
      if (visibleVal !== undefined) {
        payload.isHidden = !visibleVal;
      } else if (isHiddenVal !== undefined) {
        payload.isHidden = isHiddenVal;
      }
      // If neither provided, omit — server preserves existing value on update

      return payload as any;
    });
    bulkUpsert.mutate({ rows });
  }

  function downloadTemplate(fmt: "csv" | "json") {
    const content = fmt === "csv" ? CSV_TEMPLATE : JSON_TEMPLATE;
    const blob = new Blob([content], { type: fmt === "csv" ? "text/csv" : "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `drill-import-template.${fmt}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleClose() {
    setIsOpen(false);
    setRaw("");
    setParsed(false);
    setPreview([]);
    setImportResult(null);
  }

  // Count how many rich coaching fields are populated per row
  function countRichFields(r: Record<string, unknown>): number {
    const richKeys = ["goalOfDrill", "whoThisDrillIsBestFor", "coachSteveCue", "gameTransferExplanation",
      "coachingNotes", "whatThisDrillHelpsFix", "howToRunTheDrill", "commonMistakes"];
    return richKeys.filter(k => r[k] !== undefined && r[k] !== "" && r[k] !== null).length;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); else setIsOpen(true); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Bulk Import Drills
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import / Create & Update Drills</DialogTitle>
          <DialogDescription>
            Paste CSV or JSON to <strong>create new drills or update existing ones</strong> in one shot.
            New drills are inserted; existing drills (matched by drillId) are patched with only the fields you provide.
          </DialogDescription>
        </DialogHeader>

        {!importResult ? (
          <div className="space-y-4 mt-2">
            {/* Format toggle + template */}
            <div className="flex flex-wrap gap-2 items-center">
              {(["json", "csv"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setFormat(f); setParsed(false); }}
                  className={`px-3 py-1 rounded text-sm font-mono border transition-colors ${
                    format === f
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-transparent border-border text-muted-foreground"
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
              <div className="ml-auto flex gap-3 text-xs">
                <button
                  onClick={() => { setRaw(format === "csv" ? CSV_TEMPLATE : JSON_TEMPLATE); setParsed(false); }}
                  className="text-muted-foreground hover:text-foreground underline"
                >
                  Load {format.toUpperCase()} template
                </button>
                <button
                  onClick={() => downloadTemplate(format)}
                  className="text-primary hover:text-primary/80 underline"
                >
                  ↓ Download template
                </button>
              </div>
            </div>

            {/* Field reference */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs space-y-1.5">
                <div>
                  <span className="font-semibold">Accepted fields:</span>{" "}
                  <code className="text-destructive">drillId</code> (required) ·{" "}
                  <code className="text-yellow-600 dark:text-yellow-400">name</code> (required for new) ·{" "}
                  difficulty · duration · categories · url · ageLevel · drillType · problems · outcomes · tags ·{" "}
                  <span className="text-emerald-500">goalOfDrill · shortDescription · coachStevesCue · watchFor · whatToFeel · problemItSolves · howToDoIt · commonMistakes · visible</span>
                </div>
                <div className="text-muted-foreground">
                  <strong>Arrays:</strong> JSON <code>["A","B"]</code>, pipe <code>A|B</code>, newline (in quoted CSV cell), or comma <code>A, B</code> in CSV.
                </div>
                <div className="text-muted-foreground">
                  <strong>Updates:</strong> existing fields are preserved if omitted from the payload.
                </div>
              </AlertDescription>
            </Alert>

            <textarea
              value={raw}
              onChange={(e) => { setRaw(e.target.value); setParsed(false); }}
              rows={8}
              placeholder={format === "csv" ? "Paste CSV here…" : "Paste JSON array here…"}
              className="w-full bg-muted border border-border rounded p-3 text-sm font-mono text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary"
            />

            {/* Parse preview */}
            {parsed && preview.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">{preview.length} rows parsed — preview (first 5):</p>
                <div className="overflow-x-auto rounded border border-border">
                  <table className="text-xs w-full">
                    <thead className="bg-muted">
                      <tr>
                        {["drillId", "name", "difficulty", "goal", "coaching", "fields"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-muted-foreground font-medium whitespace-nowrap">
                            {h === "goal" ? "Goal of Drill" : h === "coaching" ? "Coach's Cue" : h === "fields" ? "Rich Fields" : h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 5).map((r, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-1.5 font-mono text-foreground">{String(r.drillId ?? "")}</td>
                          <td className="px-3 py-1.5">{String(r.name || "") || <span className="text-muted-foreground italic">update only</span>}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{String(r.difficulty || "—")}</td>
                          <td className="px-3 py-1.5 text-muted-foreground max-w-[160px] truncate">{String(r.goalOfDrill || "—")}</td>
                          <td className="px-3 py-1.5 text-muted-foreground max-w-[140px] truncate">{String(r.coachSteveCue || "—")}</td>
                          <td className="px-3 py-1.5">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              countRichFields(r) >= 6 ? "bg-green-900/30 text-green-400" :
                              countRichFields(r) >= 3 ? "bg-yellow-900/30 text-yellow-400" :
                              countRichFields(r) > 0 ? "bg-blue-900/30 text-blue-400" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {countRichFields(r)}/8
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {parsed && preview.length === 0 && (
              <p className="text-destructive text-sm">No valid rows found. Check your format and that drillId column exists.</p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              {!parsed ? (
                <Button onClick={handleParse}>Parse & Preview</Button>
              ) : (
                <Button
                  onClick={handleImport}
                  disabled={preview.length === 0 || bulkUpsert.isPending}
                >
                  {bulkUpsert.isPending
                    ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Importing…</>
                    : `Import ${preview.length} Drill${preview.length > 1 ? "s" : ""}`
                  }
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-semibold">Import Complete</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded border border-border p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{importResult.created}</div>
                <p className="text-xs text-muted-foreground mt-1">New Drills Created</p>
              </div>
              <div className="rounded border border-border p-3 text-center">
                <div className="text-2xl font-bold text-blue-500">{importResult.updated}</div>
                <p className="text-xs text-muted-foreground mt-1">Drills Updated</p>
              </div>
              <div className="rounded border border-border p-3 text-center">
                <div className={`text-2xl font-bold ${importResult.skipped > 0 ? "text-yellow-500" : "text-muted-foreground"}`}>
                  {importResult.skipped}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Rows Skipped</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">Skipped rows:</p>
                  <ul className="text-xs space-y-1">
                    {importResult.errors.slice(0, 8).map((e, i) => (
                      <li key={i}><code>{e.drillId}</code>: {e.reason}</li>
                    ))}
                    {importResult.errors.length > 8 && (
                      <li>…and {importResult.errors.length - 8} more</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={handleClose} className="w-full">Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
