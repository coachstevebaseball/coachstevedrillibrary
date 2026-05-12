import { useState } from "react";
import { Plus, X, UserPlus, Dumbbell, FileText } from "lucide-react";

interface FABAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions: FABAction[];
  /** Offset from bottom in pixels (default: 80 to clear tab bar) */
  bottomOffset?: number;
}

export function FloatingActionButton({ actions, bottomOffset = 80 }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden fixed right-4 z-40" style={{ bottom: `${bottomOffset}px` }}>
      {/* Action items */}
      <div
        className={`absolute bottom-16 right-0 flex flex-col-reverse gap-3 transition-all duration-300 ${
          isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {actions.map((action, index) => (
          <div
            key={action.id}
            className="flex items-center gap-3 justify-end"
            style={{
              transitionDelay: isOpen ? `${index * 50}ms` : "0ms",
              transform: isOpen ? "translateY(0) scale(1)" : "translateY(8px) scale(0.8)",
              opacity: isOpen ? 1 : 0,
              transition: "all 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            {/* Label */}
            <span className="px-3 py-1.5 rounded-lg bg-[rgb(20,20,22)] border border-white/10 text-sm font-medium text-foreground shadow-lg whitespace-nowrap">
              {action.label}
            </span>
            {/* Mini FAB */}
            <button
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-transform active:scale-90 ${
                action.color || "bg-white/10 border border-white/20 text-foreground"
              }`}
              aria-label={action.label}
            >
              {action.icon}
            </button>
          </div>
        ))}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 active:scale-90 ${
          isOpen
            ? "bg-white/10 border border-white/20 rotate-45"
            : "bg-electric shadow-electric/30 rotate-0"
        }`}
        aria-label={isOpen ? "Close menu" : "Open quick actions"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-foreground" />
        ) : (
          <Plus className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// Pre-configured FAB for coach dashboard
export function CoachDashboardFAB({
  onInvite,
  onAssignDrill,
  onSessionNote,
}: {
  onInvite?: () => void;
  onAssignDrill?: () => void;
  onSessionNote?: () => void;
}) {
  const actions: FABAction[] = [];

  if (onAssignDrill) {
    actions.push({
      id: "assign",
      label: "Assign Drill",
      icon: <Dumbbell className="w-5 h-5" />,
      onClick: onAssignDrill,
      color: "bg-electric text-white shadow-electric/30",
    });
  }

  if (onInvite) {
    actions.push({
      id: "invite",
      label: "Invite Athlete",
      icon: <UserPlus className="w-5 h-5" />,
      onClick: onInvite,
      color: "bg-emerald-600 text-white shadow-emerald-600/30",
    });
  }

  if (onSessionNote) {
    actions.push({
      id: "session-note",
      label: "Session Note",
      icon: <FileText className="w-5 h-5" />,
      onClick: onSessionNote,
      color: "bg-amber-600 text-white shadow-amber-600/30",
    });
  }

  if (actions.length === 0) return null;

  return <FloatingActionButton actions={actions} />;
}
