import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Plus, Library, User, type LucideIcon } from "lucide-react";

type Tab = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match when the current path starts with this prefix (deep links keep the tab active). */
  matchPrefix?: string;
};

const TABS: Tab[] = [
  { label: "Overview",  href: "/coach-dashboard",          icon: LayoutDashboard, matchPrefix: "/coach-dashboard" },
  { label: "Athletes",  href: "/coach-dashboard/athletes", icon: Users,           matchPrefix: "/coach-dashboard/athletes" },
  { label: "Assign",    href: "/coach-dashboard/assign",   icon: Plus,            matchPrefix: "/coach-dashboard/assign" },
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
      className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-[rgb(8,8,9)]/95 backdrop-blur-md pb-2 safe-area-bottom"
    >
      <div className="flex w-full max-w-full">
        {TABS.map((t) => {
          const isActive = activeHref === t.href;
          const Icon = t.icon;
          return (
            <Link key={t.href} href={t.href}>
              <a
                className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1 px-1 py-2 min-h-[56px]"
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className="h-[22px] w-[22px] flex-shrink-0"
                  style={{ color: isActive ? "oklch(70% 0.26 25)" : "oklch(80% 0 0)" }}
                />
                <span
                  className={`text-[11px] tracking-tight leading-none truncate max-w-full ${isActive ? "font-bold" : "font-medium"}`}
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
