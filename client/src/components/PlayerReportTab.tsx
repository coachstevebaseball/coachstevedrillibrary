import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  FileText, Bold, Italic, Underline, List, ListOrdered,
  Heading1, Heading2, Heading3, Link, Image, AlignLeft,
  AlignCenter, AlignRight, Printer, Download, User, Clipboard,
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

// ── Main component ────────────────────────────────────────────────────────────
export function PlayerReportTab() {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [reportTitle, setReportTitle] = useState("Player Development Report");
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Load athletes
  const { data: allUsers = [] } = trpc.admin.getAllUsers.useQuery();
  const athletes = allUsers.filter((u: any) => u.role === "athlete" || u.isActiveClient);

  const selectedAthlete = athletes.find((a: any) => String(a.id) === selectedAthleteId);

  // ── Formatting commands ─────────────────────────────────────────────────────
  const exec = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  }, []);

  const isActive = (cmd: string) => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  // ── Paste handler — strip Word/Notion markup but preserve structure ─────────
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");

    if (html) {
      // Strip problematic attributes but preserve tags
      const clean = html
        .replace(/style="[^"]*"/gi, "")
        .replace(/class="[^"]*"/gi, "")
        .replace(/id="[^"]*"/gi, "")
        .replace(/<o:p[^>]*>.*?<\/o:p>/gi, "") // Word namespace tags
        .replace(/<w:[^>]*>.*?<\/w:[^>]*>/gi, "")
        .replace(/<m:[^>]*>.*?<\/m:[^>]*>/gi, "")
        .replace(/<!--.*?-->/gs, "")
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
      // Plain text — preserve line breaks as paragraphs
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

  // ── Image insert ────────────────────────────────────────────────────────────
  const handleInsertImage = () => {
    const url = window.prompt("Enter image URL:");
    if (url) exec("insertImage", url);
  };

  // ── Link insert ─────────────────────────────────────────────────────────────
  const handleInsertLink = () => {
    const url = window.prompt("Enter link URL:");
    if (url) exec("createLink", url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="h-6 w-6 text-[#e4002b]" />
          Player Report
        </h2>
        <p className="text-white/50 mt-1 text-sm">
          Rich-text editor — paste from Notion, Google Docs, or Word and formatting is preserved.
        </p>
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
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Editor card */}
      <Card className="bg-white/[0.04] border-white/[0.08]">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-white/[0.08]">
          {/* Text format */}
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

          {/* Headings */}
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

          {/* Lists */}
          <ToolBtn onClick={() => exec("insertUnorderedList")} active={isActive("insertUnorderedList")} title="Bullet List">
            <List className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => exec("insertOrderedList")} active={isActive("insertOrderedList")} title="Numbered List">
            <ListOrdered className="h-4 w-4" />
          </ToolBtn>

          <ToolDivider />

          {/* Alignment */}
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

          {/* Link & Image */}
          <ToolBtn onClick={handleInsertLink} title="Insert Link">
            <Link className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={handleInsertImage} title="Insert Image">
            <Image className="h-4 w-4" />
          </ToolBtn>

          <ToolDivider />

          {/* Paste hint */}
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
            <Badge variant="outline" className="ml-auto border-green-500/30 text-green-400 text-xs">
              {selectedAthlete.isActiveClient ? "Active" : "Inactive"}
            </Badge>
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

        {/* Footer hint */}
        <div className="px-4 pb-4 flex items-center justify-between">
          <p className="text-xs text-white/25">
            Ctrl+B bold · Ctrl+I italic · Ctrl+Z undo · Formatting from Notion/Docs/Word is preserved on paste
          </p>
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-[#e4002b] hover:bg-[#c0001f] text-white gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </Card>
    </div>
  );
}
