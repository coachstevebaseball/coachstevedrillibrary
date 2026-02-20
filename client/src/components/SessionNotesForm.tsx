import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Check,
  Clock,
  Star,
  Loader2,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Dumbbell,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAllDrills } from "@/hooks/useAllDrills";

const SKILL_CATEGORIES = [
  "Swing Mechanics",
  "Pitch Recognition",
  "Plate Approach",
  "Fielding Fundamentals",
  "Throwing Mechanics",
  "Base Running",
  "Bunting",
  "Game IQ / Situational Awareness",
  "Confidence / Mindset",
  "Arm Care / Body Mechanics",
] as const;

// Short labels for mobile display
const SKILL_SHORT_LABELS: Record<string, string> = {
  "Swing Mechanics": "Swing",
  "Pitch Recognition": "Pitch Rec",
  "Plate Approach": "Approach",
  "Fielding Fundamentals": "Fielding",
  "Throwing Mechanics": "Throwing",
  "Base Running": "Baserunning",
  "Bunting": "Bunting",
  "Game IQ / Situational Awareness": "Game IQ",
  "Confidence / Mindset": "Mindset",
  "Arm Care / Body Mechanics": "Arm Care",
};

// Skill category colors for visual distinction
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

interface SessionNotesFormProps {
  athleteId: number;
  athleteName: string;
  onComplete?: () => void;
  onCancel?: () => void;
  /** Pre-fill from an existing session note for editing */
  editingNote?: {
    id: number;
    sessionDate: Date | string;
    duration?: number | null;
    skillsWorked: string[];
    whatImproved: string;
    whatNeedsWork: string;
    homeworkDrills?: Array<{ drillId: string; drillName: string }>;
    overallRating?: number | null;
    privateNotes?: string | null;
  };
}

export function SessionNotesForm({
  athleteId,
  athleteName,
  onComplete,
  onCancel,
  editingNote,
}: SessionNotesFormProps) {
  const isEditing = !!editingNote;

  // Form state
  const [sessionDate, setSessionDate] = useState(
    editingNote
      ? new Date(editingNote.sessionDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [duration, setDuration] = useState<string>(
    editingNote?.duration?.toString() ?? ""
  );
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    editingNote?.skillsWorked ?? []
  );
  const [whatImproved, setWhatImproved] = useState(
    editingNote?.whatImproved ?? ""
  );
  const [whatNeedsWork, setWhatNeedsWork] = useState(
    editingNote?.whatNeedsWork ?? ""
  );
  const [homeworkDrills, setHomeworkDrills] = useState<
    Array<{ drillId: string; drillName: string }>
  >(editingNote?.homeworkDrills ?? []);
  const [overallRating, setOverallRating] = useState<number>(
    editingNote?.overallRating ?? 0
  );
  const [privateNotes, setPrivateNotes] = useState(
    editingNote?.privateNotes ?? ""
  );

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [drillSearch, setDrillSearch] = useState("");
  const [showDrillPicker, setShowDrillPicker] = useState(false);

  // Get next session number
  const { data: nextSessionNumber } = trpc.sessionNotes.getNextSessionNumber.useQuery(
    { athleteId },
    { enabled: !isEditing }
  );

  // All drills (static + custom), sorted alphabetically
  const allDrillsFull = useAllDrills();
  const allDrills = useMemo(() => allDrillsFull.map(d => ({ id: d.id, name: d.name })), [allDrillsFull]);

  // Filtered drills for picker
  const filteredDrills = useMemo(() => {
    if (!drillSearch.trim()) return allDrills.slice(0, 10);
    const q = drillSearch.toLowerCase();
    return allDrills.filter((d) => d.name.toLowerCase().includes(q)).slice(0, 10);
  }, [allDrills, drillSearch]);

  const utils = trpc.useUtils();

  const createMutation = trpc.sessionNotes.create.useMutation({
    onSuccess: () => {
      toast.success("Session note saved!");
      utils.sessionNotes.getForAthlete.invalidate({ athleteId });
      utils.sessionNotes.getNextSessionNumber.invalidate({ athleteId });
      onComplete?.();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save session note");
    },
  });

  const updateMutation = trpc.sessionNotes.update.useMutation({
    onSuccess: () => {
      toast.success("Session note updated!");
      utils.sessionNotes.getForAthlete.invalidate({ athleteId });
      onComplete?.();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update session note");
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addHomeworkDrill = (drill: { id: string; name: string }) => {
    if (!homeworkDrills.find((d) => d.drillId === drill.id)) {
      setHomeworkDrills((prev) => [
        ...prev,
        { drillId: drill.id, drillName: drill.name },
      ]);
    }
    setDrillSearch("");
    setShowDrillPicker(false);
  };

  const removeHomeworkDrill = (drillId: string) => {
    setHomeworkDrills((prev) => prev.filter((d) => d.drillId !== drillId));
  };

  const handleSubmit = () => {
    if (selectedSkills.length === 0) {
      toast.error("Select at least one skill worked on");
      return;
    }
    if (!whatImproved.trim()) {
      toast.error("Describe what improved this session");
      return;
    }
    if (!whatNeedsWork.trim()) {
      toast.error("Describe what still needs work");
      return;
    }

    const payload = {
      sessionDate: new Date(sessionDate + "T12:00:00").toISOString(),
      duration: duration ? parseInt(duration) : undefined,
      skillsWorked: selectedSkills,
      whatImproved: whatImproved.trim(),
      whatNeedsWork: whatNeedsWork.trim(),
      homeworkDrills: homeworkDrills.length > 0 ? homeworkDrills : undefined,
      overallRating: overallRating > 0 ? overallRating : undefined,
      privateNotes: privateNotes.trim() || undefined,
    };

    if (isEditing && editingNote) {
      updateMutation.mutate({ id: editingNote.id, ...payload });
    } else {
      createMutation.mutate({ athleteId, ...payload });
    }
  };

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onCancel && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="h-9 w-9 rounded-lg"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h2 className="font-heading font-bold text-lg md:text-xl">
              {isEditing ? "Edit Session Note" : "New Session Note"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {athleteName}
              {!isEditing && nextSessionNumber && (
                <span className="ml-2 text-electric-blue font-medium">
                  Session #{nextSessionNumber}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Date & Duration — single row on mobile */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
            Date
          </label>
          <Input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="bg-white/[0.04] border-white/[0.08] h-11"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
            Duration (min)
          </label>
          <Input
            type="number"
            placeholder="60"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="bg-white/[0.04] border-white/[0.08] h-11"
          />
        </div>
      </div>

      {/* Skills Worked — Quick-tap chips */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">
          Skills Worked On
          <span className="text-electric-blue ml-1">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {SKILL_CATEGORIES.map((skill) => {
            const isSelected = selectedSkills.includes(skill);
            return (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border
                  touch-manipulation select-none active:scale-95
                  ${
                    isSelected
                      ? SKILL_COLORS[skill] + " ring-1 ring-white/20"
                      : "bg-white/[0.04] text-white/50 border-white/[0.08] hover:bg-white/[0.08] hover:text-white/70"
                  }
                `}
              >
                {isSelected && <Check className="h-3 w-3 inline mr-1.5" />}
                <span className="sm:hidden">{SKILL_SHORT_LABELS[skill]}</span>
                <span className="hidden sm:inline">{skill}</span>
              </button>
            );
          })}
        </div>
        {selectedSkills.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1.5">
            {selectedSkills.length} skill{selectedSkills.length !== 1 ? "s" : ""} selected
          </p>
        )}
      </div>

      {/* What Improved */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
          What Improved This Session
          <span className="text-electric-blue ml-1">*</span>
        </label>
        <Textarea
          placeholder="e.g., Made a real adjustment keeping hands inside the ball, consistently barreling balls to middle and opposite field by the second round of front toss..."
          value={whatImproved}
          onChange={(e) => setWhatImproved(e.target.value)}
          rows={3}
          className="bg-white/[0.04] border-white/[0.08] resize-none text-sm"
        />
      </div>

      {/* What Still Needs Work */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
          What Still Needs Work
          <span className="text-electric-blue ml-1">*</span>
        </label>
        <Textarea
          placeholder="e.g., Load timing still has a small hitch causing inconsistency. Need to clean up the timing piece before we move to live pitching..."
          value={whatNeedsWork}
          onChange={(e) => setWhatNeedsWork(e.target.value)}
          rows={3}
          className="bg-white/[0.04] border-white/[0.08] resize-none text-sm"
        />
      </div>

      {/* Homework Drills — Quick search + add */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
          Homework Drills Assigned
        </label>

        {/* Selected drills */}
        {homeworkDrills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {homeworkDrills.map((d) => (
              <Badge
                key={d.drillId}
                variant="secondary"
                className="bg-electric-blue/15 text-electric-blue border-electric-blue/30 pr-1.5 gap-1"
              >
                <Dumbbell className="h-3 w-3" />
                {d.drillName}
                <button
                  type="button"
                  onClick={() => removeHomeworkDrill(d.drillId)}
                  className="ml-1 hover:bg-white/10 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Drill search */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search drills to assign..."
                value={drillSearch}
                onChange={(e) => {
                  setDrillSearch(e.target.value);
                  setShowDrillPicker(true);
                }}
                onFocus={() => setShowDrillPicker(true)}
                className="pl-9 bg-white/[0.04] border-white/[0.08] h-10"
              />
            </div>
          </div>

          {/* Drill picker dropdown */}
          {showDrillPicker && (
            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-card border border-white/[0.1] rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {filteredDrills.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  No drills found
                </div>
              ) : (
                filteredDrills.map((drill) => {
                  const isAdded = homeworkDrills.some(
                    (d) => d.drillId === drill.id
                  );
                  return (
                    <button
                      key={drill.id}
                      type="button"
                      onClick={() =>
                        !isAdded && addHomeworkDrill(drill)
                      }
                      disabled={isAdded}
                      className={`w-full text-left px-3 py-2.5 text-sm transition-colors border-b border-white/[0.04] last:border-0 ${
                        isAdded
                          ? "text-muted-foreground opacity-50"
                          : "hover:bg-white/[0.06] text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isAdded && <Check className="h-3 w-3 text-green-400" />}
                        {drill.name}
                      </span>
                    </button>
                  );
                })
              )}
              <button
                type="button"
                onClick={() => setShowDrillPicker(false)}
                className="w-full text-center py-2 text-xs text-muted-foreground hover:bg-white/[0.04] border-t border-white/[0.08]"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overall Rating — Star rating */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
          Session Rating
          <span className="text-muted-foreground/60 ml-1 normal-case">(private — not in reports)</span>
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setOverallRating(n === overallRating ? 0 : n)}
              className="p-1 touch-manipulation active:scale-90 transition-transform"
            >
              <Star
                className={`h-7 w-7 transition-colors ${
                  n <= overallRating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-white/20 hover:text-white/40"
                }`}
              />
            </button>
          ))}
          {overallRating > 0 && (
            <span className="text-sm text-muted-foreground self-center ml-2">
              {overallRating}/5
            </span>
          )}
        </div>
      </div>

      {/* Advanced section — collapsible */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        {showAdvanced ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        Private Coach Notes
      </button>

      {showAdvanced && (
        <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
          <Textarea
            placeholder="Internal notes — never shared with parents or athletes..."
            value={privateNotes}
            onChange={(e) => setPrivateNotes(e.target.value)}
            rows={2}
            className="bg-white/[0.04] border-white/[0.08] resize-none text-sm"
          />
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-12 text-base"
            disabled={isSaving}
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isSaving || selectedSkills.length === 0 || !whatImproved.trim() || !whatNeedsWork.trim()}
          className="flex-1 h-12 text-base bg-electric-blue hover:bg-electric-blue/90 font-semibold"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : isEditing ? (
            "Update Session Note"
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Save Session Note
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
