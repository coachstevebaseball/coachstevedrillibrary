/**
 * AthleteVideoFeedback — Shows approved AI video analysis feedback to athletes.
 * Athletes only see feedback that has been approved or sent by the coach.
 * All coach functions are hidden from this view.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Video,
  CheckCircle,
  Star,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { Streamdown } from "streamdown";

export function AthleteVideoFeedback() {
  const { data: analyses = [], isLoading } = trpc.videoAnalysis.getAthleteAnalyses.useQuery();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selectedAnalysis = analyses.find((a: any) => a.id === selectedId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (analyses.length === 0) {
    return null; // Don't show section if no feedback available
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-purple-400" />
        Video Feedback
        <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 ml-2">
          {analyses.length}
        </Badge>
      </h3>

      <div className="grid gap-3">
        {(analyses as any[]).map((analysis) => (
          <Card
            key={analysis.id}
            className="bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06] transition-all cursor-pointer group"
            onClick={() => setSelectedId(analysis.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-16 bg-white/[0.06] rounded-lg flex items-center justify-center shrink-0">
                  <Video className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{analysis.drillId}</p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {(analysis.createdAt instanceof Date ? analysis.createdAt : new Date(analysis.createdAt)).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Feedback Ready
                </Badge>
                <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feedback Detail Dialog */}
      <Dialog open={!!selectedAnalysis} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-[#0f172a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Video Feedback — {selectedAnalysis?.drillId}
            </DialogTitle>
          </DialogHeader>

          {selectedAnalysis && (
            <div className="space-y-6 mt-4">
              {/* Video */}
              {selectedAnalysis.videoUrl ? (
                <div className="rounded-lg overflow-hidden bg-black">
                  <video
                    src={selectedAnalysis.videoUrl}
                    controls
                    className="w-full max-h-[300px]"
                    preload="metadata"
                  />
                </div>
              ) : (
                <div className="rounded-lg bg-white/[0.04] border border-white/[0.08] h-32 flex items-center justify-center">
                  <p className="text-white/40 text-sm">No video available</p>
                </div>
              )}

              {/* AI Feedback structured view */}
              {selectedAnalysis.aiFeedback && (
                <div className="space-y-5">
                  {/* Overall */}
                  <div className="bg-white/[0.04] rounded-lg p-4 border border-white/[0.08]">
                    <h4 className="font-semibold text-white mb-2">Overall Assessment</h4>
                    <p className="text-white/70 text-sm leading-relaxed">
                      {(selectedAnalysis.aiFeedback as any).overallAssessment}
                    </p>
                  </div>

                  {/* Mechanics */}
                  {(selectedAnalysis.aiFeedback as any).mechanicsBreakdown?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-white mb-3">Mechanics Breakdown</h4>
                      <div className="grid gap-2">
                        {(selectedAnalysis.aiFeedback as any).mechanicsBreakdown.map((phase: any, i: number) => (
                          <div key={i} className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-medium text-white text-sm">{phase.phase}</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`h-3.5 w-3.5 ${s <= phase.rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-white/60">{phase.observation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {(selectedAnalysis.aiFeedback as any).strengths?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-green-400 mb-2 text-sm">What You&apos;re Doing Well</h4>
                      <ul className="space-y-1.5">
                        {(selectedAnalysis.aiFeedback as any).strengths.map((s: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                            <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Areas for Improvement */}
                  {(selectedAnalysis.aiFeedback as any).areasForImprovement?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-amber-400 mb-2 text-sm">Focus Areas</h4>
                      <ul className="space-y-1.5">
                        {(selectedAnalysis.aiFeedback as any).areasForImprovement.map((a: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                            <ArrowRight className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Coaching Cues */}
                  {(selectedAnalysis.aiFeedback as any).coachingCues?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-purple-400 mb-2 text-sm">Remember These Cues</h4>
                      <div className="flex flex-wrap gap-2">
                        {(selectedAnalysis.aiFeedback as any).coachingCues.map((c: string, i: number) => (
                          <Badge key={i} variant="outline" className="border-purple-500/30 text-purple-300 text-xs">
                            &ldquo;{c}&rdquo;
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Coach edited feedback (markdown) */}
              {selectedAnalysis.coachEditedFeedback && !selectedAnalysis.aiFeedback && (
                <div className="bg-white/[0.04] rounded-lg p-4 border border-white/[0.08]">
                  <div className="prose prose-sm prose-invert max-w-none">
                    <Streamdown>{selectedAnalysis.coachEditedFeedback}</Streamdown>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
