import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  FileText, Bold, Italic, Underline, List, ListOrdered,
  Heading1, Heading2, Heading3, Link, Image, AlignLeft,
  AlignCenter, AlignRight, Printer, User, Clipboard,
  Save, Globe, EyeOff, Trash2, Plus, ChevronLeft,
} from "lucide-react";

// ── Toolbar button ────────────────────────────────────────────────────────────
function ToolBtn({
  onClick, active, title, children,
}: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? "bg-[#e4002b]/20 text-[#e4002b]"
          : "text-white/50 hover:text-white hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function ToolDivider() {
  return <div className="w-px h-5 bg-white/10 mx-1" />;
}

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Main component ────────────────────────────────────────────────────────────
export function PlayerReportTab() {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [reportTitle, setReportTitle] = useState("Player Development Report");
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [view, setView] = useState<"list" | "editor">("list");
  const editorRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();

  // Load athletes
  const { data: allUsers = [] } = trpc.admin.getAllUsers.useQuery();
  const athletes = allUsers.filter((u: any) => u.role === "athlete" || u.isActiveClient);
  const selectedAthlete = athletes.find((a: any) => String(a.id) === selectedAthleteId);

  // Load saved reports for selected athlete
  const { data: savedReports = [], isLoading: reportsLoading } = trpc.playerReports.listByCoach.useQuery(
    { athleteId: selectedAthleteId ? Number(selectedAthleteId) : undefined },
    { enabled: !!selectedAthleteId }
  );

  // Mutations
  const createMutation = trpc.playerReports.create.useMutation({
    onSuccess: () => utils.playerReports.listByCoach.invalidate(),
  });
  const updateMutation = trpc.playerReports.update.useMutation({
    onSuccess: () => utils.playerReports.listByCoach.invalidate(),
  });
  const publishMutation = trpc.playerReports.publish.useMutation({
    onSuccess: () => utils.playerReports.listByCoach.invalidate(),
  });
  const unpublishMutation = trpc.playerReports.unpublish.useMutation({
    onSuccess: () => utils.playerReports.listByCoach.invalidate(),
  });
  const deleteMutation = trpc.playerReports.delete.useMutation({
    onSuccess: () => {
      utils.playerReports.listByCoach.invalidate();
      if (editingReportId) {
        setEditingReportId(null);
        setView("list");
      }
    },
  });

  // ── Formatting commands ─────────────────────────────────────────────────────
  const exec = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  }, []);

  const isActive = (cmd: string) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  // ── Load report into editor ─────────────────────────────────────────────────
  const loadReport = useCallback((report: any) => {
    setEditingReportId(report.id);
    setReportTitle(report.title);
    setSelectedAthleteId(String(report.athleteId));
    setView("editor");
    // Set editor HTML after render
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = report.bodyHtml || "";
      }
    }, 50);
  }, []);

  // ── New report ──────────────────────────────────────────────────────────────
  const startNewReport = () => {
    setEditingReportId(null);
    setReportTitle("Player Development Report");
    setView("editor");
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = "";
    }, 50);
  };

  // ── Save draft ──────────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!selectedAthleteId) { toast.error("Please select an athlete first"); return; }
    const bodyHtml = editorRef.current?.innerHTML || "";
    try {
      if (editingReportId) {
        await updateMutation.mutateAsync({ id: editingReportId, title: reportTitle, bodyHtml });
        toast.success("Draft saved");
      } else {
        const report = await createMutation.mutateAsync({
          athleteId: Number(selectedAthleteId),
          title: reportTitle,
          bodyHtml,
          publishNow: false,
        });
        setEditingReportId(report.id);
        toast.success("Draft saved");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    }
  };

  // ── Save & Publish ──────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!selectedAthleteId) { toast.error("Please select an athlete first"); return; }
    const bodyHtml = editorRef.current?.innerHTML || "";
    try {
      let reportId = editingReportId;
      if (reportId) {
        await updateMutation.mutateAsync({ id: reportId, title: reportTitle, bodyHtml });
      } else {
        const report = await createMutation.mutateAsync({
          athleteId: Number(selectedAthleteId),
          title: reportTitle,
          bodyHtml,
          publishNow: false,
        });
        reportId = report.id;
        setEditingReportId(reportId);
      }
      await publishMutation.mutateAsync({ id: reportId! });
      toast.success("Report published to athlete portal");
    } catch (e: any) {
      toast.error(e?.message || "Failed to publish");
    }
  };

  // ── Paste handler — strip Word/Notion markup but preserve structure ─────────
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    if (html) {
      const clean = html
        .replace(/style="[^"]*"/gi, "")
        .replace(/class="[^"]*"/gi, "")
        .replace(/id="[^"]*"/gi, "")
        .replace(/<o:p[^>]*>.*?<\/o:p>/gi, "")
        .replace(/<w:[^>]*>.*?<\/w:[^>]*>/gi, "")
        .replace(/<m:[^>]*>.*?<\/m:[^>]*>/gi, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<font[^>]*>/gi, "").replace(/<\/font>/gi, "")
        .replace(/<span[^>]*>\s*<\/span>/gi, "")
        .replace(/<p[^>]*>/gi, "<p>").replace(/<\/p>/gi, "</p>")
        .replace(/<h([1-6])[^>]*>/gi, "<h$1>")
        .replace(/<ul[^>]*>/gi, "<ul>").replace(/<ol[^>]*>/gi, "<ol>")
        .replace(/<li[^>]*>/gi, "<li>")
        .replace(/<strong[^>]*>/gi, "<strong>").replace(/<b[^>]*>/gi, "<strong>").replace(/<\/b>/gi, "</strong>")
        .replace(/<em[^>]*>/gi, "<em>").replace(/<i[^>]*>/gi, "<em>").replace(/<\/i>/gi, "</em>")
        .replace(/<u[^>]*>/gi, "<u>")
        .replace(/<a\s+href="([^"]+)"[^>]*>/gi, '<a href="$1">');
      document.execCommand("insertHTML", false, clean);
    } else if (text) {
      const paras = text.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
      document.execCommand("insertHTML", false, paras || text);
    }
  }, []);

  // ── Print ───────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const content = editorRef.current?.innerHTML || "";
    const athleteName = selectedAthlete
      ? (selectedAthlete.name && !selectedAthlete.name.includes("@") ? selectedAthlete.name : selectedAthlete.email)
      : "Player";
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head>
      <title>${reportTitle} — ${athleteName}</title>
      <style>
        body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.7; }
        h1 { font-size: 2em; color: #0A1628; border-bottom: 3px solid #e4002b; padding-bottom: 8px; }
        h2 { font-size: 1.5em; color: #0A1628; margin-top: 1.5em; }
        h3 { font-size: 1.2em; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2em; }
        .header-info { font-size: 0.85em; color: #666; }
        img { max-width: 100%; border-radius: 6px; }
        @media print { body { margin: 20px; } }
      </style>
      </head><body>
      <div class="header">
        <div>
          <h1>${reportTitle}</h1>
          <div class="header-info">
            <strong>Athlete:</strong> ${athleteName}<br>
            <strong>Date:</strong> ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}<br>
            <strong>Coach:</strong> Coach Steve — Process Over Outcome
          </div>
        </div>
      </div>
      ${content}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isPublishing = publishMutation.isPending || isSaving;

  // ── LIST VIEW ───────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="h-6 w-6 text-[#e4002b]" />
              Player Reports
            </h2>
            <p className="text-white/50 mt-1 text-sm">
              Author rich-text reports and publish them to the athlete portal.
            </p>
          </div>
          <Button
            onClick={startNewReport}
            className="bg-[#e4002b] hover:bg-[#c0001f] text-white gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New Report
          </Button>
        </div>

        {/* Athlete filter */}
        <div className="max-w-xs">
          <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Filter by Athlete</label>
          <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
            <SelectTrigger className="bg-white/[0.06] border-white/10 text-white">
              <SelectValue placeholder="All athletes..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-athletes">All athletes</SelectItem>
              {athletes.map((a: any) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.name && !a.name.includes("@") ? a.name : a.email?.split("@")[0] || `Athlete #${a.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reports table */}
        {reportsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-white/[0.04] animate-pulse" />)}
          </div>
        ) : savedReports.length === 0 ? (
          <div className="text-center py-16 bg-white/[0.02] rounded-xl border border-dashed border-white/10">
            <FileText className="h-10 w-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No reports yet. Click "New Report" to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-3 px-4 text-white/50 font-medium">Title</th>
                  <th className="text-left py-3 px-3 text-white/50 font-medium">Athlete</th>
                  <th className="text-center py-3 px-3 text-white/50 font-medium">Status</th>
                  <th className="text-left py-3 px-3 text-white/50 font-medium">Published</th>
                  <th className="text-left py-3 px-3 text-white/50 font-medium">Updated</th>
                  <th className="w-28 py-3 px-3 text-white/50 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedReports.map((r: any) => (
                  <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3 px-4 text-white font-medium max-w-xs truncate">{r.title}</td>
                    <td className="py-3 px-3 text-white/60 text-xs">
                      {r.athleteName && !r.athleteName.includes("@") ? r.athleteName : r.athleteEmail?.split("@")[0] || `#${r.athleteId}`}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {r.isSharedWithAthlete ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Published</Badge>
                      ) : (
                        <Badge variant="outline" className="text-white/40 border-white/10 text-xs">Draft</Badge>
                      )}
                    </td>
                    <td className="py-3 px-3 text-white/40 text-xs whitespace-nowrap">{formatDate(r.publishedAt)}</td>
                    <td className="py-3 px-3 text-white/40 text-xs whitespace-nowrap">{formatDate(r.updatedAt)}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => loadReport(r)}
                          className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                          title="Edit report"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>
                        {r.isSharedWithAthlete ? (
                          <button
                            onClick={() => unpublishMutation.mutate({ id: r.id })}
                            disabled={unpublishMutation.isPending}
                            className="p-1.5 rounded hover:bg-amber-500/10 text-amber-400/50 hover:text-amber-400 transition-colors"
                            title="Unpublish from athlete portal"
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => publishMutation.mutate({ id: r.id })}
                            disabled={publishMutation.isPending}
                            className="p-1.5 rounded hover:bg-green-500/10 text-green-400/50 hover:text-green-400 transition-colors"
                            title="Publish to athlete portal"
                          >
                            <Globe className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm("Delete this report permanently?")) {
                              deleteMutation.mutate({ id: r.id });
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"
                          title="Delete report"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── EDITOR VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView("list")}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          title="Back to reports list"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#e4002b]" />
            {editingReportId ? "Edit Report" : "New Report"}
          </h2>
          <p className="text-white/50 mt-0.5 text-xs">
            Paste from Notion, Google Docs, or Word — formatting is preserved.
          </p>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Athlete</label>
          <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
            <SelectTrigger className="bg-white/[0.06] border-white/10 text-white">
              <SelectValue placeholder="Select athlete..." />
            </SelectTrigger>
            <SelectContent>
              {athletes.map((a: any) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.name && !a.name.includes("@") ? a.name : a.email?.split("@")[0] || `Athlete #${a.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-48">
          <label className="text-xs text-white/50 uppercase tracking-wider mb-1.5 block">Report Title</label>
          <input
            value={reportTitle}
            onChange={e => setReportTitle(e.target.value)}
            className="w-full bg-white/[0.06] border border-white/10 rounded-md text-white text-sm px-3 py-2 focus:outline-none focus:border-[#e4002b]/50"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 border-white/20 text-white/70 hover:text-white hover:bg-white/10"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="gap-1.5 border-white/20 text-white/70 hover:text-white hover:bg-white/10"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving…" : "Save Draft"}
          </Button>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={isPublishing}
            className="gap-1.5 bg-[#e4002b] hover:bg-[#c0001f] text-white"
          >
            <Globe className="h-4 w-4" />
            {isPublishing ? "Publishing…" : "Save & Publish"}
          </Button>
        </div>
      </div>

      {/* Editor card */}
      <Card className="bg-white/[0.04] border-white/[0.08]">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-white/[0.08]">
          <ToolBtn onClick={() => exec("bold")} active={isActive("bold")} title="Bold (Ctrl+B)">
            <Bold className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => exec("italic")} active={isActive("italic")} title="Italic (Ctrl+I)">
            <Italic className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => exec("underline")} active={isActive("underline")} title="Underline (Ctrl+U)">
            <Underline className="h-4 w-4" />
          </ToolBtn>
          <ToolDivider />
          <ToolBtn onClick={() => exec("formatBlock", "h1")} title="Heading 1">
            <Heading1 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => exec("formatBlock", "h2")} title="Heading 2">
            <Heading2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => exec("formatBlock", "h3")} title="Heading 3">
            <Heading3 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => exec("formatBlock", "p")} title="Paragraph">
            <span className="text-xs font-mono px-0.5">¶</span>
          </ToolBtn>
          <ToolDivider />
          <ToolBtn onClick={() => exec("insertUnorderedList")} active={isActive("insertUnorderedList")} title="Bullet List">
            <List className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => exec("insertOrderedList")} active={isActive("insertOrderedList")} title="Numbered List">
            <ListOrdered className="h-4 w-4" />
          </ToolBtn>
          <ToolDivider />
          <ToolBtn onClick={() => exec("justifyLeft")} title="Align Left">
            <AlignLeft className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => exec("justifyCenter")} title="Align Center">
            <AlignCenter className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => exec("justifyRight")} title="Align Right">
            <AlignRight className="h-4 w-4" />
          </ToolBtn>
          <ToolDivider />
          <ToolBtn onClick={() => { const url = window.prompt("Enter link URL:"); if (url) exec("createLink", url); }} title="Insert Link">
            <Link className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => { const url = window.prompt("Enter image URL:"); if (url) exec("insertImage", url); }} title="Insert Image">
            <Image className="h-4 w-4" />
          </ToolBtn>
          <ToolDivider />
          <div className="ml-auto flex items-center gap-1.5 text-xs text-white/30">
            <Clipboard className="h-3.5 w-3.5" />
            Paste from Notion, Docs, or Word
          </div>
        </div>

        {/* Athlete header in editor */}
        {selectedAthlete && (
          <div className="mx-4 mt-4 flex items-center gap-3 p-3 bg-white/[0.04] rounded-lg border border-white/[0.06]">
            <div className="h-9 w-9 rounded-full bg-[#e4002b]/20 flex items-center justify-center text-[#e4002b] font-bold text-sm flex-shrink-0">
              {(selectedAthlete.name && !selectedAthlete.name.includes("@")
                ? selectedAthlete.name
                : selectedAthlete.email || "A"
              ).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-medium text-sm">
                {selectedAthlete.name && !selectedAthlete.name.includes("@")
                  ? selectedAthlete.name
                  : selectedAthlete.email?.split("@")[0]}
              </p>
              <p className="text-white/40 text-xs">{selectedAthlete.email}</p>
            </div>
            {editingReportId && (
              <Badge variant="outline" className="ml-auto border-white/10 text-white/40 text-xs">
                Report #{editingReportId}
              </Badge>
            )}
          </div>
        )}

        {/* Content-editable editor */}
        <CardContent className="p-4">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onPaste={handlePaste}
            spellCheck
            className={`
              min-h-[500px] outline-none text-white/90 text-sm leading-relaxed
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-3 [&_h1]:mt-4 [&_h1]:pb-2 [&_h1]:border-b [&_h1]:border-[#e4002b]/30
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mb-2 [&_h2]:mt-4
              [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white/90 [&_h3]:mb-2 [&_h3]:mt-3
              [&_p]:mb-2 [&_p]:text-white/80
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ul]:text-white/80
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_ol]:text-white/80
              [&_li]:mb-1
              [&_strong]:text-white [&_b]:text-white
              [&_em]:text-white/70
              [&_a]:text-[#e4002b] [&_a]:underline
              [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3
              [&_blockquote]:border-l-4 [&_blockquote]:border-[#e4002b]/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-white/60 [&_blockquote]:my-3
              focus:ring-0
            `}
            data-placeholder="Start typing your player report here, or paste content from Notion, Google Docs, or Word..."
            style={{ caretColor: "#e4002b" }}
          />
        </CardContent>

        {/* Footer */}
        <div className="px-4 pb-4 flex items-center justify-between">
          <p className="text-xs text-white/25">
            Ctrl+B bold · Ctrl+I italic · Ctrl+Z undo · Formatting from Notion/Docs/Word is preserved on paste
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="gap-1.5 border-white/20 text-white/70 hover:text-white hover:bg-white/10"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving…" : "Save Draft"}
            </Button>
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={isPublishing}
              className="gap-1.5 bg-[#e4002b] hover:bg-[#c0001f] text-white"
            >
              <Globe className="h-4 w-4" />
              {isPublishing ? "Publishing…" : "Save & Publish"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
