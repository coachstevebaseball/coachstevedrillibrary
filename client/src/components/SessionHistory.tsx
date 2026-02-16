import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  FileText,
  Dumbbell,
  Loader2,
  Plus,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Skill category colors (matching SessionNotesForm)
const SKILL_COLORS: Record<string, string> = {
  "Swing Mechanics": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Pitch Recognition": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Plate Approach": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "Fielding Fundamentals": "bg-green-500/20 text-green-300 border-green-500/30",
  "Throwing Mechanics": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Base Running": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "Bunting": "bg-lime-500/20 text-lime-300 border-lime-500/30",
  "Game IQ / Situational Awareness": "bg-rose-500/20 text-rose-300 border-rose-500/30",
  "Confidence / Mindset": "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "Arm Care / Body Mechanics": "bg-teal-500/20 text-teal-300 border-teal-500/30",
};

interface SessionHistoryProps {
  athleteId: number;
  athleteName: string;
  onNewNote?: () => void;
  onEditNote?: (note: any) => void;
  onGenerateReport?: (noteId: number) => void;
}

export function SessionHistory({
  athleteId,
  athleteName,
  onNewNote,
  onEditNote,
  onGenerateReport,
}: SessionHistoryProps) {
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);

  const { data, isLoading } = trpc.sessionNotes.getForAthlete.useQuery({
    athleteId,
  });

  const utils = trpc.useUtils();

  const deleteMutation = trpc.sessionNotes.delete.useMutation({
    onSuccess: () => {
      toast.success("Session note deleted");
      utils.sessionNotes.getForAthlete.invalidate({ athleteId });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete");
    },
  });

  const notes = data?.notes ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-electric-blue" />
        <span className="ml-2 text-muted-foreground">Loading sessions...</span>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="h-16 w-16 rounded-full bg-white/[0.06] flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-heading font-bold text-lg mb-2">No Session Notes Yet</h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
          Start logging session notes for {athleteName} to track progress and generate reports.
        </p>
        {onNewNote && (
          <Button
            onClick={onNewNote}
            className="bg-electric-blue hover:bg-electric-blue/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Log First Session
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-bold text-lg">Session History</h3>
          <p className="text-sm text-muted-foreground">
            {notes.length} session{notes.length !== 1 ? "s" : ""} logged for {athleteName}
          </p>
        </div>
        {onNewNote && (
          <Button
            onClick={onNewNote}
            size="sm"
            className="bg-electric-blue hover:bg-electric-blue/90"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">New Note</span>
            <span className="sm:hidden">Add</span>
          </Button>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-white/[0.08]" />

        {notes.map((note: any, index: number) => {
          const isExpanded = expandedNoteId === note.id;
          const skillsWorked = (note.skillsWorked as string[]) ?? [];
          const homeworkDrills = (note.homeworkDrills as Array<{ drillId: string; drillName: string }>) ?? [];
          const sessionDate = new Date(note.sessionDate);

          return (
            <div key={note.id} className="relative pl-10 pb-4">
              {/* Timeline dot */}
              <div
                className={`absolute left-2.5 top-3 h-3 w-3 rounded-full border-2 transition-colors ${
                  isExpanded
                    ? "bg-electric-blue border-electric-blue"
                    : "bg-background border-white/20"
                }`}
              />

              {/* Card */}
              <div
                className={`glass-card rounded-xl overflow-hidden transition-all duration-200 ${
                  isExpanded ? "ring-1 ring-electric-blue/30" : ""
                }`}
              >
                {/* Collapsed header — always visible */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedNoteId(isExpanded ? null : note.id)
                  }
                  className="w-full text-left p-3 md:p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-bold text-sm md:text-base">
                        Session #{note.sessionNumber}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {sessionDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {note.duration && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {note.duration}min
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {skillsWorked.slice(0, 3).map((skill: string) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            SKILL_COLORS[skill] ?? "bg-white/[0.06] text-white/60"
                          }`}
                        >
                          {skill}
                        </Badge>
                      ))}
                      {skillsWorked.length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 bg-white/[0.04] text-white/40"
                        >
                          +{skillsWorked.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {note.overallRating && note.overallRating > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium text-yellow-400">
                          {note.overallRating}
                        </span>
                      </div>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-3 md:px-4 pb-3 md:pb-4 space-y-3 border-t border-white/[0.06] pt-3 animate-in slide-in-from-top-2 duration-200">
                    {/* What Improved */}
                    <div>
                      <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">
                        What Improved
                      </h4>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {note.whatImproved}
                      </p>
                    </div>

                    {/* What Needs Work */}
                    <div>
                      <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                        What Needs Work
                      </h4>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {note.whatNeedsWork}
                      </p>
                    </div>

                    {/* Homework Drills */}
                    {homeworkDrills.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-electric-blue uppercase tracking-wider mb-1.5">
                          Homework Drills
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {homeworkDrills.map((d: any) => (
                            <Badge
                              key={d.drillId}
                              variant="secondary"
                              className="bg-electric-blue/10 text-electric-blue border-electric-blue/20 text-xs"
                            >
                              <Dumbbell className="h-3 w-3 mr-1" />
                              {d.drillName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Private Notes */}
                    {note.privateNotes && (
                      <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Private Notes
                        </h4>
                        <p className="text-sm text-foreground/60 italic">
                          {note.privateNotes}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      {onGenerateReport && (
                        <Button
                          size="sm"
                          onClick={() => onGenerateReport(note.id)}
                          className="bg-electric-blue hover:bg-electric-blue/90 text-xs"
                        >
                          <FileText className="h-3.5 w-3.5 mr-1.5" />
                          Generate Report
                        </Button>
                      )}
                      {onEditNote && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditNote(note)}
                          className="text-xs"
                        >
                          <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                          Edit
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm("Delete this session note?")) {
                            deleteMutation.mutate({ id: note.id });
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
