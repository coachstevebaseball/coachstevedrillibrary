import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Table2, UserCog, Plus, Target, Library, Video,
  FileText, ClipboardList, Inbox, Activity, Sparkles, History,
  Bell, Mail, Tag, GitMerge, Goal, Upload, User,
  type LucideIcon,
} from "lucide-react";

export type NavItem =
  | { kind: "route"; label: string; href: string; icon: LucideIcon }
  | { kind: "action"; label: string; action: SidebarAction; icon: LucideIcon };

export type SidebarAction = "open-bulk-goals" | "open-bulk-import";

export type NavGroup = {
  heading: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    heading: "ATHLETES",
    items: [
      { kind: "route", label: "Overview",         href: "/coach-dashboard",          icon: LayoutDashboard },
      { kind: "route", label: "Athletes Table",   href: "/coach-dashboard/athletes", icon: Table2 },
      { kind: "route", label: "User Management",  href: "/coach-dashboard/users",    icon: UserCog },
    ],
  },
  {
    heading: "TRAINING",
    items: [
      { kind: "route", label: "Assign Drills",     href: "/coach-dashboard/assign",  icon: Plus },
      { kind: "route", label: "Practice Planner",  href: "/coach-dashboard/planner", icon: Target },
      { kind: "route", label: "Drill Library",     href: "/coach-dashboard/library", icon: Library },
      { kind: "route", label: "Manage Videos",     href: "/coach-dashboard/videos",  icon: Video },
    ],
  },
  {
    heading: "REPORTS",
    items: [
      { kind: "route", label: "Player Reports", href: "/coach-dashboard/reports",     icon: FileText },
      { kind: "route", label: "Session Notes",  href: "/coach-dashboard/notes",       icon: ClipboardList },
      { kind: "route", label: "Submissions",    href: "/coach-dashboard/submissions", icon: Inbox },
    ],
  },
  {
    heading: "ANALYTICS",
    items: [
      { kind: "route", label: "Blast Metrics",  href: "/coach-dashboard/blast",    icon: Activity },
      { kind: "route", label: "Video Analysis", href: "/coach-dashboard/analysis", icon: Sparkles },
      { kind: "route", label: "Activity Feed",  href: "/coach-dashboard/activity", icon: History },
    ],
  },
  {
    heading: "COMMUNICATIONS",
    items: [
      { kind: "route", label: "Notifications",  href: "/coach-dashboard/notifications", icon: Bell },
      { kind: "route", label: "Email Settings", href: "/coach-dashboard/email",         icon: Mail },
    ],
  },
  {
    heading: "ADMIN",
    items: [
      { kind: "route",  label: "Drill Tags",      href: "/coach-dashboard/tags",    icon: Tag },
      { kind: "route",  label: "Dedup Athletes",  href: "/coach-dashboard/dedup",   icon: GitMerge },
      { kind: "action", label: "Bulk Goals…",  action: "open-bulk-goals",        icon: Goal },
      { kind: "action", label: "Bulk Import…", action: "open-bulk-import",       icon: Upload },
      { kind: "route",  label: "My Account",     href: "/coach-dashboard/account", icon: User },
    ],
  },
];

type SidebarProps = {
  onAction?: (action: SidebarAction) => void;
  onNavigate?: () => void; // fires after a route link click (mobile drawer closes itself)
};

const BRAND_BG = "oklch(50% 0.2 25 / 0.15)"; // crimson @ 15%
const BRAND_DOT = "oklch(50% 0.2 25)";       // crimson

export function Sidebar({ onAction, onNavigate }: SidebarProps) {
  const [location] = useLocation();

  const baseItem =
    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm min-h-[44px] transition-colors";
  const inactive = "text-white/70 hover:text-white hover:bg-white/8";

  return (
    <aside
      className="h-screen w-56 flex-shrink-0 border-r border-white/10 bg-[rgb(10,10,10)] overflow-y-auto"
      aria-label="Dashboard navigation"
    >
      <Link href="/coach-dashboard">
        <a
          onClick={onNavigate}
          className="flex items-center gap-2 px-4 h-14 border-b border-white/10 hover:bg-white/5 transition-colors"
        >
          <div className="h-7 w-7 rounded-md bg-[oklch(50%_0.2_25)] flex items-center justify-center font-heading font-bold text-xs text-white">
            CS
          </div>
          <span className="text-white font-heading font-bold text-sm">Coach Steve</span>
        </a>
      </Link>

      <nav className="px-2 py-4 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.heading}>
            <h3
              className="px-3 mb-2 text-[10px] font-bold tracking-widest"
              style={{ color: "oklch(72% 0.22 25)" }}
            >
              {group.heading}
            </h3>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;

                if (item.kind === "route") {
                  const isActive = location === item.href;
                  return (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <a
                          onClick={onNavigate}
                          aria-current={isActive ? "page" : undefined}
                          className={`${baseItem} ${
                            isActive ? "text-white" : inactive
                          }`}
                          style={isActive ? { backgroundColor: BRAND_BG } : undefined}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                          {isActive && (
                            <span
                              className="ml-auto h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: BRAND_DOT }}
                            />
                          )}
                        </a>
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={item.action}>
                    <button
                      type="button"
                      onClick={() => onAction?.(item.action)}
                      className={`${baseItem} ${inactive} w-full text-left`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
