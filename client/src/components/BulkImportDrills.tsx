import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseJsonArr(val: string | string[] | undefined): string[] | undefined {
  if (!val) return undefined;
  if (Array.isArray(val)) return val;
  const trimmed = val.trim();
  if (trimmed.startsWith("[")) {
    try { return JSON.parse(trimmed); } catch { /* fall through */ }
  }
  return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseBulkCSV(raw: string): Record<string, string>[] {
  const lines = raw.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const cols: string[] = [];
    let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { cols.push(cur); cur = ""; continue; }
      cur += ch;
    }
    cols.push(cur);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (cols[i] ?? "").trim(); });
    if (row["drillid"] && !row["drillid"]) row["drillid"] = row["drillid"];
    return row;
  }).filter((r) => !!(r["drillid"] || r["drillId"]));
}

function parseBulkJSON(raw: string): Record<string, unknown>[] {
  try {
    const arr = JSON.parse(raw.trim());
    if (!Array.isArray(arr)) return [];
    return arr.filter((r) => r && typeof r === "object" && (r.drillId || r.drillid));
  } catch { return []; }
}

const JSON_TEMPLATE = JSON.stringify([
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

const CSV_TEMPLATE = `drillId,name,difficulty,categories,duration,url,ageLevel,drillType,problems,outcomes,tags
new-drill-example,My New Drill,Medium,"Hitting",10m,https://example.com/drill,"Youth,High School",Constraint,"Timing Issues, Poor Load","Improve Timing, Improve Barrel Path","timing, rhythm"
existing-drill-id,,,,,,,,"Bat Path Issues",,`;

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
      const drillId = ((r.drillId ?? r.drillid ?? "") as string).trim();
      return {
        drillId,
        name: (r.name as string) || undefined,
        difficulty: ((r.difficulty as string) || undefined) as 'Easy' | 'Medium' | 'Hard' | undefined,
        categories: r.categories ? parseJsonArr(r.categories as string) : undefined,
        duration: (r.duration as string) || undefined,
        url: (r.url as string) || undefined,
        ageLevel: r.ageLevel ? parseJsonArr(r.ageLevel as string) : undefined,
        drillType: (r.drillType as string) || undefined,
        problems: r.problems ? parseJsonArr(r.problems as string) : undefined,
        outcomes: r.outcomes ? parseJsonArr(r.outcomes as string) : undefined,
        tags: r.tags ? parseJsonArr(r.tags as string) : undefined,
        problem: r.problem ? parseJsonArr(r.problem as string) : undefined,
        goal: r.goal ? parseJsonArr(r.goal as string) : undefined,
      };
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
              <AlertDescription className="text-xs">
                <span className="font-semibold">Required:</span> <code className="text-destructive">drillId</code> (always) · <code className="text-yellow-600 dark:text-yellow-400">name</code> (for new drills only)
                <br />
                <span className="font-semibold">Optional:</span> difficulty · categories · duration · url · ageLevel · drillType · problems · outcomes · tags
                <br />
                <span className="text-muted-foreground">Existing drills will be updated and new drills will be added. Arrays: <code>["A","B"]</code> or <code>"A, B"</code> in CSV.</span>
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
                        {["drillId", "name", "difficulty", "problems", "outcomes"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-muted-foreground font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 5).map((r, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-1.5 font-mono text-foreground">{String(r.drillId ?? r.drillid ?? "")}</td>
                          <td className="px-3 py-1.5">{String(r.name || "") || <span className="text-muted-foreground italic">update only</span>}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{String(r.difficulty || "—")}</td>
                          <td className="px-3 py-1.5 text-muted-foreground max-w-[140px] truncate">{String(r.problems || "—")}</td>
                          <td className="px-3 py-1.5 text-muted-foreground max-w-[140px] truncate">{String(r.outcomes || "—")}</td>
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
                    : <><Upload className="h-4 w-4 mr-2" />Import {preview.length} rows</>}
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
