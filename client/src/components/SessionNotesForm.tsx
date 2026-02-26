import { useState, useMemo, useRef, useEffect } from "react";
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
  Pencil,
  Sparkles,
  Plus,
  Zap,
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
  "Swing Mechanics": "bg-[#DC143C]/20 text-[#E8425A] border-[#DC143C]/30",
  "Pitch Recognition": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Plate Approach": "bg-[#DC143C]/20 text-[#E8425A] border-[#DC143C]/30",
  "Fielding Fundamentals": "bg-green-500/20 text-green-300 border-green-500/30",
  "Throwing Mechanics": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Base Running": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "Bunting": "bg-lime-500/20 text-lime-300 border-lime-500/30",
  "Game IQ / Situational Awareness": "bg-rose-500/20 text-rose-300 border-rose-500/30",
  "Confidence / Mindset": "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "Arm Care / Body Mechanics": "bg-teal-500/20 text-teal-300 border-teal-500/30",
};

// ============================================================
// Pre-built coaching template phrases organized by skill category
// These are based on Coach Steve's common coaching observations
// ============================================================

interface TemplateOption {
  label: string;
  text: string;
  category?: string; // skill category this relates to
}

const IMPROVED_TEMPLATES: TemplateOption[] = [
  // Swing Mechanics
  { label: "Hands inside the ball", text: "Made a real adjustment keeping hands inside the ball, consistently barreling balls to middle and opposite field.", category: "Swing Mechanics" },
  { label: "Bat path improvement", text: "Bat path is getting shorter and more direct to the ball. Seeing much better contact quality on inside pitches.", category: "Swing Mechanics" },
  { label: "Hip rotation timing", text: "Hip rotation is firing earlier and more explosively. Getting better separation between upper and lower half.", category: "Swing Mechanics" },
  { label: "Load & stride consistency", text: "Load and stride are becoming more consistent and repeatable. Timing mechanism is more reliable.", category: "Swing Mechanics" },
  { label: "Extension through contact", text: "Much better extension through the hitting zone. Staying through the ball instead of pulling off.", category: "Swing Mechanics" },
  { label: "Back elbow slot", text: "Back elbow is slotting in nicely, creating a tighter swing path and better barrel accuracy.", category: "Swing Mechanics" },
  // Pitch Recognition
  { label: "Identifying off-speed early", text: "Recognizing off-speed pitches earlier in the flight path. Laying off breaking balls in the dirt.", category: "Pitch Recognition" },
  { label: "Tracking spin", text: "Starting to pick up spin out of the pitcher's hand. Making better swing decisions on first-pitch breaking balls.", category: "Pitch Recognition" },
  { label: "Fastball timing", text: "Fastball timing is locked in. Getting on plane early and driving the ball with authority.", category: "Pitch Recognition" },
  // Plate Approach
  { label: "Working the count", text: "Taking more competitive at-bats. Working deeper into counts and fouling off tough pitches.", category: "Plate Approach" },
  { label: "Hunting fastball early", text: "Doing a great job hunting the fastball early in the count and being aggressive on hittable pitches.", category: "Plate Approach" },
  { label: "Two-strike approach", text: "Two-strike approach is improving. Shortening up and putting the ball in play instead of expanding the zone.", category: "Plate Approach" },
  { label: "Zone awareness", text: "Better understanding of the strike zone. Laying off borderline pitches and attacking pitches in the hitting zone.", category: "Plate Approach" },
  // Fielding Fundamentals
  { label: "Ground ball footwork", text: "Ground ball footwork is much cleaner. Getting into a good fielding position with feet active through the ball.", category: "Fielding Fundamentals" },
  { label: "Glove work improvement", text: "Glove work is softer and more relaxed. Receiving the ball out front with better hand-eye coordination.", category: "Fielding Fundamentals" },
  { label: "Throwing accuracy", text: "Throws are more accurate and on-line. Getting a good four-seam grip and following through to the target.", category: "Fielding Fundamentals" },
  // Throwing Mechanics
  { label: "Arm action cleanup", text: "Arm action is getting cleaner and more efficient. Less wasted motion in the arm circle.", category: "Throwing Mechanics" },
  { label: "Lower half engagement", text: "Better engagement of the lower half in the throwing motion. Getting more drive from the back leg.", category: "Throwing Mechanics" },
  // Base Running
  { label: "First-step quickness", text: "First-step quickness off the base is improving. Reading the pitcher's move better and getting better jumps.", category: "Base Running" },
  { label: "Rounding bases", text: "Rounding bases more efficiently. Taking better angles and maintaining speed through the turn.", category: "Base Running" },
  // Bunting
  { label: "Bunt technique", text: "Bunt technique is solid. Getting the bat angle right and placing the ball effectively.", category: "Bunting" },
  // Game IQ
  { label: "Situational awareness", text: "Much better situational awareness. Making smart decisions based on the game situation, count, and runners.", category: "Game IQ / Situational Awareness" },
  { label: "In-game adjustments", text: "Making quality in-game adjustments after seeing a pitcher for the second time through the order.", category: "Game IQ / Situational Awareness" },
  // Confidence / Mindset
  { label: "Competitive confidence", text: "Confidence is growing. Competing with a more aggressive mindset and trusting the work put in during practice.", category: "Confidence / Mindset" },
  { label: "Bounce-back mentality", text: "Showing great bounce-back mentality. Not letting a bad at-bat carry over to the next one.", category: "Confidence / Mindset" },
  // Arm Care
  { label: "Arm care routine", text: "Arm care routine is becoming more consistent. Doing a great job with band work and recovery protocols.", category: "Arm Care / Body Mechanics" },
  // General
  { label: "Overall effort & focus", text: "Great effort and focus throughout the entire session. Locked in and coachable.", category: undefined },
  { label: "Applying drill work to live", text: "Successfully transferring drill work into live reps. The training is translating.", category: undefined },
];

const NEEDS_WORK_TEMPLATES: TemplateOption[] = [
  // Swing Mechanics
  { label: "Load timing hitch", text: "Load timing still has a small hitch causing inconsistency. Need to clean up the timing piece before we move to live pitching.", category: "Swing Mechanics" },
  { label: "Pulling off the ball", text: "Still pulling the front shoulder open too early. Need to stay closed longer and trust the hands to the ball.", category: "Swing Mechanics" },
  { label: "Bat drag", text: "Bat drag is still present on inside pitches. Back elbow needs to work tighter to the body through the zone.", category: "Swing Mechanics" },
  { label: "Over-swinging", text: "Trying to do too much with the swing. Need to focus on controlled aggression and letting the bat speed come naturally.", category: "Swing Mechanics" },
  { label: "Posture at contact", text: "Losing posture at the point of contact. Head is moving and eyes aren't staying on the ball through the zone.", category: "Swing Mechanics" },
  { label: "Weight transfer", text: "Weight transfer is still back-heavy. Need to get more into the front side while maintaining balance.", category: "Swing Mechanics" },
  // Pitch Recognition
  { label: "Chasing breaking balls", text: "Still chasing breaking balls below the zone. Need to work on recognizing spin earlier and trusting the take.", category: "Pitch Recognition" },
  { label: "Fastball late", text: "Getting beat by the fastball consistently. Need to commit to the fastball and adjust to off-speed, not the other way around.", category: "Pitch Recognition" },
  { label: "First-pitch takes", text: "Taking too many first-pitch fastballs right down the middle. Need to be more aggressive on hittable pitches early.", category: "Pitch Recognition" },
  // Plate Approach
  { label: "Expanding the zone", text: "Expanding the zone too much with two strikes. Need to tighten up the chase rate on pitcher's pitches.", category: "Plate Approach" },
  { label: "Count leverage", text: "Not taking advantage of hitter's counts. Need to be more aggressive when ahead in the count.", category: "Plate Approach" },
  { label: "Pitch selection", text: "Pitch selection needs work. Swinging at too many pitcher's pitches instead of waiting for something in the zone.", category: "Plate Approach" },
  // Fielding Fundamentals
  { label: "Backhand plays", text: "Backhand plays need more work. Not getting low enough and the glove isn't out front on the ball.", category: "Fielding Fundamentals" },
  { label: "Double play feeds", text: "Double play feeds need to be quicker and more accurate. Working on getting rid of the ball faster.", category: "Fielding Fundamentals" },
  { label: "Slow roller charging", text: "Needs to be more aggressive charging slow rollers. Getting to the ball on time but not attacking it.", category: "Fielding Fundamentals" },
  // Throwing Mechanics
  { label: "Arm slot consistency", text: "Arm slot is inconsistent. Dropping down at times which causes the ball to tail and lose accuracy.", category: "Throwing Mechanics" },
  { label: "Follow-through", text: "Not finishing throws with a complete follow-through. Cutting the throw short which reduces velocity and accuracy.", category: "Throwing Mechanics" },
  // Base Running
  { label: "Reading pitcher's move", text: "Needs to study pitcher's pickoff move more. Getting picked off or hesitating on steal attempts.", category: "Base Running" },
  { label: "Secondary leads", text: "Secondary leads are too passive. Need to be more aggressive getting into scoring position.", category: "Base Running" },
  // Game IQ
  { label: "Situational hitting", text: "Situational hitting needs improvement. Not adjusting approach based on game situation (runner on 3rd, less than 2 outs).", category: "Game IQ / Situational Awareness" },
  { label: "Between-pitch routine", text: "Between-pitch routine needs to be more consistent. Losing focus between pitches and not resetting properly.", category: "Game IQ / Situational Awareness" },
  // Confidence / Mindset
  { label: "Body language after mistakes", text: "Body language drops after mistakes. Need to work on maintaining a confident presence regardless of results.", category: "Confidence / Mindset" },
  { label: "Competing in pressure moments", text: "Tightening up in pressure situations. Need to trust the training and compete freely when the game is on the line.", category: "Confidence / Mindset" },
  // Arm Care
  { label: "Pre-throwing routine", text: "Pre-throwing routine needs to be more consistent. Skipping warm-up steps which increases injury risk.", category: "Arm Care / Body Mechanics" },
  // General
  { label: "Consistency between sessions", text: "Need more consistency between sessions. Good days are really good but the off days show regression in fundamentals.", category: undefined },
  { label: "Drill-to-live transfer", text: "Drill work looks great in isolation but not fully transferring to live at-bats yet. Need more bridge work between drills and game speed.", category: undefined },
];

// ============================================================
// Template Picker Component
// ============================================================
function TemplatePicker({
  templates,
  selectedSkills,
  currentText,
  onSelect,
  label,
}: {
  templates: TemplateOption[];
  selectedSkills: string[];
  currentText: string;
  onSelect: (text: string) => void;
  label: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<string>("relevant");
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Filter templates based on selected skills
  const filteredTemplates = useMemo(() => {
    if (filter === "all") return templates;
    // Show templates matching selected skills + general ones
    return templates.filter(
      (t) => !t.category || selectedSkills.includes(t.category)
    );
  }, [templates, selectedSkills, filter]);

  const handleSelect = (template: TemplateOption) => {
    if (currentText.trim()) {
      // Append to existing text with a separator
      onSelect(currentText.trim() + " " + template.text);
    } else {
      onSelect(template.text);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-7 px-2 text-xs text-[#DC143C] hover:text-[#DC143C]/80 hover:bg-[#DC143C]/10 gap-1"
      >
        <Sparkles className="h-3 w-3" />
        Quick Fill
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {isOpen && (
        <div className="absolute z-30 top-full mt-1 left-0 right-0 min-w-[320px] max-w-[calc(100vw-2rem)] bg-card/95 backdrop-blur-xl border border-white/[0.12] rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.08] bg-white/[0.02]">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mr-1">Show:</span>
            <button
              type="button"
              onClick={() => setFilter("relevant")}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                filter === "relevant"
                  ? "bg-[#DC143C]/20 text-[#DC143C]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Relevant
            </button>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                filter === "all"
                  ? "bg-[#DC143C]/20 text-[#DC143C]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
          </div>

          {/* Template list */}
          <div className="max-h-56 overflow-y-auto overscroll-contain">
            {filteredTemplates.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                <p>No templates match selected skills.</p>
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="text-[#DC143C] hover:underline mt-1 text-xs"
                >
                  Show all templates
                </button>
              </div>
            ) : (
              filteredTemplates.map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(template)}
                  className="w-full text-left px-3 py-2.5 hover:bg-white/[0.06] transition-colors border-b border-white/[0.04] last:border-0 group"
                >
                  <div className="flex items-start gap-2">
                    <Zap className="h-3.5 w-3.5 text-[#DC143C]/60 mt-0.5 shrink-0 group-hover:text-[#DC143C] transition-colors" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground block">
                        {template.label}
                      </span>
                      <span className="text-xs text-muted-foreground line-clamp-2 mt-0.5 block">
                        {template.text}
                      </span>
                      {template.category && (
                        <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                          {template.category}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full text-center py-2 text-xs text-muted-foreground hover:bg-white/[0.04] border-t border-white/[0.08]"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main Form Component
// ============================================================

interface SessionNotesFormProps {
  athleteId: number;
  athleteName: string;
  onComplete?: () => void;
  onCancel?: () => void;
  /** Pre-fill from an existing session note for editing */
  editingNote?: {
    id: number;
    sessionDate: Date | string;
    sessionNumber?: number;
    sessionLabel?: string | null;
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

  // Session label state — editable title
  const [sessionLabel, setSessionLabel] = useState(
    editingNote?.sessionLabel ?? ""
  );
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);

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

  // Compute the display label
  const displayLabel = sessionLabel.trim()
    || (isEditing && editingNote?.sessionNumber
      ? `Session #${editingNote.sessionNumber}`
      : nextSessionNumber
        ? `Session #${nextSessionNumber}`
        : "New Session");

  const handleLabelEdit = () => {
    setIsEditingLabel(true);
    // Pre-fill with current display if empty
    if (!sessionLabel.trim()) {
      setSessionLabel(displayLabel);
    }
    setTimeout(() => labelInputRef.current?.focus(), 50);
  };

  const handleLabelSave = () => {
    setIsEditingLabel(false);
    // If they cleared it or set it back to the default, reset to empty (use auto)
    const defaultLabel = isEditing && editingNote?.sessionNumber
      ? `Session #${editingNote.sessionNumber}`
      : nextSessionNumber
        ? `Session #${nextSessionNumber}`
        : "";
    if (sessionLabel.trim() === defaultLabel) {
      setSessionLabel("");
    }
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
      sessionLabel: sessionLabel.trim() || undefined,
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
      {/* Header with editable session label */}
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
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-muted-foreground">{athleteName}</span>
              <span className="text-muted-foreground/40">·</span>
              {isEditingLabel ? (
                <div className="flex items-center gap-1">
                  <Input
                    ref={labelInputRef}
                    value={sessionLabel}
                    onChange={(e) => setSessionLabel(e.target.value)}
                    onBlur={handleLabelSave}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLabelSave();
                      if (e.key === "Escape") {
                        setSessionLabel(editingNote?.sessionLabel ?? "");
                        setIsEditingLabel(false);
                      }
                    }}
                    placeholder={displayLabel}
                    className="h-6 w-40 text-sm bg-[#DC143C]/10 border-[#DC143C]/30 text-[#DC143C] px-2 py-0"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleLabelEdit}
                  className="flex items-center gap-1 text-sm text-[#DC143C] font-medium hover:text-[#DC143C]/80 transition-colors group"
                >
                  {displayLabel}
                  <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>
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
          <span className="text-[#DC143C] ml-1">*</span>
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

      {/* What Improved — with template picker */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            What Improved This Session
            <span className="text-[#DC143C] ml-1">*</span>
          </label>
          <TemplatePicker
            templates={IMPROVED_TEMPLATES}
            selectedSkills={selectedSkills}
            currentText={whatImproved}
            onSelect={setWhatImproved}
            label="improved"
          />
        </div>
        <Textarea
          placeholder="Select a template above or type your own observations..."
          value={whatImproved}
          onChange={(e) => setWhatImproved(e.target.value)}
          rows={3}
          className="bg-white/[0.04] border-white/[0.08] resize-none text-sm"
        />
      </div>

      {/* What Still Needs Work — with template picker */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            What Still Needs Work
            <span className="text-[#DC143C] ml-1">*</span>
          </label>
          <TemplatePicker
            templates={NEEDS_WORK_TEMPLATES}
            selectedSkills={selectedSkills}
            currentText={whatNeedsWork}
            onSelect={setWhatNeedsWork}
            label="needs-work"
          />
        </div>
        <Textarea
          placeholder="Select a template above or type your own observations..."
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
                className="bg-[#DC143C]/15 text-[#DC143C] border-[#DC143C]/30 pr-1.5 gap-1"
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
          className="flex-1 h-12 text-base bg-[#DC143C] hover:bg-[#DC143C]/90 font-semibold"
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
