import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Plus, Library, User, type LucideIcon } from "lucide-react";
import { hapticLight } from "@/lib/haptics";

type Tab = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match when the current path starts with this prefix (deep links keep the tab active). */
  matchPrefix?: string;
  /** Whether this is the primary action tab */
  isPrimary?: boolean;
};

const TABS: Tab[] = [
  { label: "Overview",  href: "/coach-dashboard",          icon: LayoutDashboard, matchPrefix: "/coach-dashboard" },
  { label: "Athletes",  href: "/coach-dashboard/athletes", icon: Users,           matchPrefix: "/coach-dashboard/athletes" },
  { label: "Assign",    href: "/coach-dashboard/assign",   icon: Plus,            matchPrefix: "/coach-dashboard/assign", isPrimary: true },
  { label: "Library",   href: "/coach-dashboard/library",  icon: Library,         matchPrefix: "/coach-dashboard/library" },
  { label: "Account",   href: "/coach-dashboard/account",  icon: User,            matchPrefix: "/coach-dashboard/account" },
];

export function MobileTabBar() {
  const [location] = useLocation();

  const activeHref = (() => {
    // Pick the most specific (longest matching prefix).
    const matches = TABS.filter((t) => {
      if (t.href === "/coach-dashboard") return location === "/coach-dashboard";
      return location === t.matchPrefix || location.startsWith(`${t.matchPrefix}/`);
    });
    if (matches.length === 0) return null;
    return matches.sort((a, b) => (b.matchPrefix?.length ?? 0) - (a.matchPrefix?.length ?? 0))[0].href;
  })();

  return (
    <nav
      aria-label="Quick navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-[rgb(8,8,9)]/95 backdrop-blur-md safe-area-bottom"
    >
      <div className="flex w-full max-w-full">
        {TABS.map((t) => {
          const isActive = activeHref === t.href;
          const Icon = t.icon;
          return (
            <Link key={t.href} href={t.href}>
              <a
                className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-1 px-1 pt-2 pb-3 min-h-[56px] transition-all duration-200 active:scale-90 ${
                  t.isPrimary ? "relative" : ""
                }`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => hapticLight()}
              >
                {/* Active indicator dot */}
                {isActive && !t.isPrimary && (
                  <span className="absolute top-1 w-1 h-1 rounded-full bg-[oklch(70%_0.26_25)] animate-pulse" />
                )}

                {/* Primary action button (raised) */}
                {t.isPrimary ? (
                  <span className={`flex items-center justify-center w-11 h-11 -mt-4 rounded-full shadow-lg transition-all duration-200 ${
                    isActive
                      ? "bg-[oklch(70%_0.26_25)] shadow-[oklch(70%_0.26_25)]/30 scale-110"
                      : "bg-white/10 border border-white/20"
                  }`}>
                    <Icon
                      className="h-5 w-5"
                      style={{ color: isActive ? "#fff" : "oklch(80% 0 0)" }}
                    />
                  </span>
                ) : (
                  <Icon
                    className={`h-[22px] w-[22px] flex-shrink-0 transition-all duration-200 ${isActive ? "scale-110" : ""}`}
                    style={{ color: isActive ? "oklch(70% 0.26 25)" : "oklch(80% 0 0)" }}
                  />
                )}

                <span
                  className={`text-[10px] tracking-tight leading-none truncate max-w-full transition-all duration-200 ${
                    isActive ? "font-bold" : "font-medium opacity-70"
                  } ${t.isPrimary ? "mt-0.5" : ""}`}
                  style={{ color: isActive ? "oklch(70% 0.26 25)" : "oklch(80% 0 0)" }}
                >
                  {t.label}
                </span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
