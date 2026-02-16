import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Send,
  Pencil,
  Eye,
  Loader2,
  Check,
  Mail,
  FileText,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface ReportContent {
  greeting: string;
  sessionSummary: string;
  strengths: string;
  areasForImprovement: string;
  homeworkAndNextSteps: string;
  playerNote: string;
  signOff: string;
}

interface ProgressReportReviewProps {
  sessionNoteId: number;
  athleteId: number;
  athleteName: string;
  parentEmail?: string;
  parentName?: string;
  onBack: () => void;
  /** If provided, load an existing report instead of generating a new one */
  existingReportId?: number;
}

export function ProgressReportReview({
  sessionNoteId,
  athleteId,
  athleteName,
  parentEmail: initialParentEmail,
  parentName: initialParentName,
  onBack,
  existingReportId,
}: ProgressReportReviewProps) {

  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [reportId, setReportId] = useState<number | null>(existingReportId ?? null);
  const [reportContent, setReportContent] = useState<ReportContent | null>(null);
  const [reportHtml, setReportHtml] = useState<string>("");
  const [reportTitle, setReportTitle] = useState<string>("");
  const [status, setStatus] = useState<"draft" | "reviewed" | "sent">("draft");
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendEmail, setSendEmail] = useState(initialParentEmail ?? "");
  const [sendName, setSendName] = useState(initialParentName ?? "");

  // Generate report mutation
  const generateMutation = trpc.progressReports.generate.useMutation({
    onSuccess: (data: any) => {
      setReportId(data.id);
      setReportContent(data.reportContent as ReportContent);
      setReportHtml(data.reportHtml);
      setReportTitle(data.title);
      setStatus(data.status);
      toast.success("Report generated — review and edit before sending.");
    },
    onError: (err: any) => {
      toast.error(`Generation failed: ${err.message}`);
    },
  });

  // Load existing report
  const existingReport = trpc.progressReports.getById.useQuery(
    { id: existingReportId! },
    { enabled: !!existingReportId }
  );

  // Update report mutation
  const updateMutation = trpc.progressReports.update.useMutation({
    onSuccess: () => {
      toast.success("Report saved");
      setMode("preview");
    },
    onError: (err: any) => {
      toast.error(`Save failed: ${err.message}`);
    },
  });

  // Send report mutation
  const sendMutation = trpc.progressReports.sendToParent.useMutation({
    onSuccess: () => {
      setStatus("sent");
      setShowSendDialog(false);
      toast.success(`Report sent to ${sendEmail}`);
    },
    onError: (err: any) => {
      toast.error(`Send failed: ${err.message}`);
    },
  });

  // Auto-generate on mount if no existing report
  useEffect(() => {
    if (!existingReportId) {
      generateMutation.mutate({
        sessionNoteId,
        parentName: initialParentName,
        parentEmail: initialParentEmail,
      });
    }
  }, []);

  // Load existing report data
  useEffect(() => {
    if (existingReport.data) {
      const data = existingReport.data as any;
      setReportContent(data.reportContent as ReportContent);
      setReportHtml(data.reportHtml);
      setReportTitle(data.title);
      setStatus(data.status);
    }
  }, [existingReport.data]);

  const isLoading = generateMutation.isPending || existingReport.isLoading;

  const handleSaveEdits = () => {
    if (!reportId || !reportContent) return;
    updateMutation.mutate({
      id: reportId,
      reportContent: reportContent as unknown as Record<string, string>,
      status: "reviewed",
    });
    setStatus("reviewed");
  };

  const handleSend = () => {
    if (!reportId || !sendEmail) return;
    sendMutation.mutate({
      reportId,
      parentEmail: sendEmail,
      parentName: sendName || undefined,
    });
  };

  const handleRegenerate = () => {
    generateMutation.mutate({
      sessionNoteId,
      parentName: sendName || initialParentName,
      parentEmail: sendEmail || initialParentEmail,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-electric-blue/20 to-cyan-500/20 flex items-center justify-center animate-pulse">
            <Sparkles className="h-8 w-8 text-electric-blue animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="font-heading font-bold text-lg mb-1">
            Generating Progress Report
          </h3>
          <p className="text-sm text-muted-foreground">
            Writing in Coach Steve's voice...
          </p>
        </div>
      </div>
    );
  }

  if (!reportContent) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to generate report. Please try again.</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h2 className="font-heading font-bold text-lg leading-tight">
              {reportTitle || "Progress Report"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={
                  status === "sent"
                    ? "bg-green-500/10 text-green-400 border-green-500/30"
                    : status === "reviewed"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                }
              >
                {status === "sent" ? "Sent" : status === "reviewed" ? "Reviewed" : "Draft"}
              </Badge>
              <span className="text-xs text-muted-foreground">{athleteName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={generateMutation.isPending}
            className="h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${generateMutation.isPending ? "animate-spin" : ""}`} />
            Regenerate
          </Button>
          {mode === "preview" ? (
            <Button variant="outline" size="sm" onClick={() => setMode("edit")} className="h-8">
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSaveEdits}
              disabled={updateMutation.isPending}
              className="h-8 bg-electric-blue hover:bg-electric-blue/90"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5 mr-1" />
              )}
              Save
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setShowSendDialog(true)}
            className="h-8 bg-green-600 hover:bg-green-700"
            disabled={status === "sent"}
          >
            <Send className="h-3.5 w-3.5 mr-1" />
            {status === "sent" ? "Sent" : "Send to Parent"}
          </Button>
        </div>
      </div>

      {/* Report Content */}
      {mode === "edit" ? (
        <div className="space-y-4 glass-card rounded-xl p-6">
          <p className="text-xs text-muted-foreground mb-2">
            Edit each section below. Changes are saved when you click "Save".
          </p>

          <EditableSection
            label="Greeting"
            value={reportContent.greeting}
            onChange={(v) => setReportContent({ ...reportContent, greeting: v })}
          />
          <EditableSection
            label="Session Summary"
            value={reportContent.sessionSummary}
            onChange={(v) => setReportContent({ ...reportContent, sessionSummary: v })}
            multiline
          />
          <EditableSection
            label="What Stood Out (Strengths)"
            value={reportContent.strengths}
            onChange={(v) => setReportContent({ ...reportContent, strengths: v })}
            multiline
          />
          <EditableSection
            label="What We're Building On (Areas for Improvement)"
            value={reportContent.areasForImprovement}
            onChange={(v) => setReportContent({ ...reportContent, areasForImprovement: v })}
            multiline
          />
          <EditableSection
            label="Next Steps & Homework"
            value={reportContent.homeworkAndNextSteps}
            onChange={(v) => setReportContent({ ...reportContent, homeworkAndNextSteps: v })}
            multiline
          />
          <EditableSection
            label="Note to Player"
            value={reportContent.playerNote}
            onChange={(v) => setReportContent({ ...reportContent, playerNote: v })}
            multiline
          />
          <EditableSection
            label="Sign-Off"
            value={reportContent.signOff}
            onChange={(v) => setReportContent({ ...reportContent, signOff: v })}
          />
        </div>
      ) : (
        /* Preview Mode — render the report as it would appear in email */
        <div className="glass-card rounded-xl overflow-hidden">
          {/* Branded Header */}
          <div className="bg-gradient-to-r from-[#0a1628] to-[#1a2744] text-white p-8 text-center">
            <h3 className="font-heading font-bold text-xl mb-1">Coach Steve</h3>
            <p className="text-xs text-blue-400 font-medium tracking-widest uppercase">
              Elite Instruction. Measurable Growth.
            </p>
          </div>

          {/* Meta bar */}
          <div className="bg-[#1e3a5f] text-slate-400 px-8 py-3 flex justify-between text-xs">
            <span>{athleteName} — {reportTitle.split("—")[0]?.trim()}</span>
            <span>{reportTitle.split("—")[1]?.trim()}</span>
          </div>

          {/* Report Body */}
          <div className="p-8 space-y-4 bg-white dark:bg-slate-950">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {reportContent.greeting}
            </p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {reportContent.sessionSummary}
            </p>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-green-600 mb-2 pb-1 border-b-2 border-green-200 dark:border-green-900">
                What Stood Out
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {reportContent.strengths}
              </p>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-2 pb-1 border-b-2 border-amber-200 dark:border-amber-900">
                What We're Building On
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {reportContent.areasForImprovement}
              </p>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-2 pb-1 border-b-2 border-blue-200 dark:border-blue-900">
                Next Steps & Homework
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {reportContent.homeworkAndNextSteps}
              </p>
            </div>

            {/* Player Note */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <p className="text-blue-800 dark:text-blue-300 italic leading-relaxed">
                {reportContent.playerNote}
              </p>
            </div>

            <p className="font-semibold text-slate-900 dark:text-slate-100 mt-6">
              {reportContent.signOff}
            </p>
          </div>

          {/* Branded Footer */}
          <div className="bg-[#0a1628] text-center py-6 px-8">
            <p className="text-blue-400 font-semibold text-sm">Coach Steve Goldstein</p>
            <p className="text-slate-500 text-[11px] tracking-widest uppercase mt-1">
              Elite Instruction. Measurable Growth.
            </p>
          </div>
        </div>
      )}

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-electric-blue" />
              Send Report to Parent
            </DialogTitle>
            <DialogDescription>
              Send {athleteName}'s progress report via email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                Parent Email
              </label>
              <Input
                type="email"
                value={sendEmail}
                onChange={(e) => setSendEmail(e.target.value)}
                placeholder="parent@email.com"
                className="bg-white/[0.04] border-white/[0.08]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                Parent Name (optional)
              </label>
              <Input
                value={sendName}
                onChange={(e) => setSendName(e.target.value)}
                placeholder="e.g., Mr. Johnson"
                className="bg-white/[0.04] border-white/[0.08]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!sendEmail || sendMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Editable section for inline editing mode */
function EditableSection({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
        {label}
      </label>
      {multiline ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="bg-white/[0.04] border-white/[0.08] resize-y text-sm leading-relaxed"
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-white/[0.04] border-white/[0.08] text-sm"
        />
      )}
    </div>
  );
}
