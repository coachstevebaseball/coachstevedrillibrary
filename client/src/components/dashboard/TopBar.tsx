import { Menu, Plus, UserPlus } from "lucide-react";

type TopBarProps = {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  onInvite?: () => void;
  onAddDrill?: () => void;
};

function defaultSubtitle(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function TopBar({ title, subtitle, onMenuClick, onInvite, onAddDrill }: TopBarProps) {
  const sub = subtitle ?? defaultSubtitle();
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[rgb(11,11,12)]">
      <div className="flex flex-wrap items-center gap-2 px-3 sm:px-6 py-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden flex h-11 w-11 items-center justify-center rounded-lg text-white/70 hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1 order-3 sm:order-2 basis-full sm:basis-auto">
          <h1 className="font-heading text-base sm:text-lg font-bold text-white truncate">
            {title}
          </h1>
          <p className="text-xs text-white/70 truncate">{sub}</p>
        </div>

        <div className="flex items-center gap-2 ml-auto order-2 sm:order-3">
          {onInvite && (
            <button
              type="button"
              onClick={onInvite}
              className="flex items-center gap-1.5 h-11 px-3 sm:px-4 rounded-full border border-white/25 text-white font-medium hover:bg-white/10 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label="Invite user"
            >
              <UserPlus className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Invite User</span>
            </button>
          )}
          {onAddDrill && (
            <button
              type="button"
              onClick={onAddDrill}
              className="flex items-center gap-1.5 h-11 px-3 sm:px-4 rounded-full border border-white/25 text-white font-medium hover:bg-white/10 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label="Add new drill"
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Add New Drill</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
