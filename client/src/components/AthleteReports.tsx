import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { FileText, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function AthleteReports() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: reports = [], isLoading } = trpc.playerReports.listMyReports.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-12 rounded-xl bg-white/[0.04] animate-pulse" />
        <div className="h-12 rounded-xl bg-white/[0.04] animate-pulse" />
      </div>
    );
  }

  if (reports.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#e4002b]" />
          My Reports
        </h3>
        <Badge className="bg-[#e4002b]/20 text-[#e4002b] border border-[#e4002b]/30">
          {reports.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {reports.map((report: any) => (
          <div
            key={report.id}
            className="glass rounded-xl overflow-hidden border border-white/[0.06]"
          >
            {/* Report header — click to expand */}
            <button
              onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.03] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-[#e4002b]/15 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-[#e4002b]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium text-sm truncate">{report.title}</p>
                {report.publishedAt && (
                  <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    Published {formatDate(report.publishedAt)}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 text-muted-foreground">
                {expandedId === report.id
                  ? <ChevronUp className="w-4 h-4" />
                  : <ChevronDown className="w-4 h-4" />
                }
              </div>
            </button>

            {/* Report body — expanded */}
            {expandedId === report.id && report.bodyHtml && (
              <div className="px-4 pb-4 border-t border-white/[0.06]">
                <div
                  className={`
                    mt-4 text-sm leading-relaxed text-foreground/80
                    [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mb-3 [&_h1]:mt-4 [&_h1]:pb-2 [&_h1]:border-b [&_h1]:border-[#e4002b]/30
                    [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-2 [&_h2]:mt-4
                    [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground/90 [&_h3]:mb-2 [&_h3]:mt-3
                    [&_p]:mb-2
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2
                    [&_li]:mb-1
                    [&_strong]:text-foreground [&_b]:text-foreground
                    [&_a]:text-[#e4002b] [&_a]:underline
                    [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3
                    [&_blockquote]:border-l-4 [&_blockquote]:border-[#e4002b]/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-foreground/60 [&_blockquote]:my-3
                  `}
                  dangerouslySetInnerHTML={{ __html: report.bodyHtml }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
