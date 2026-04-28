import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  User,
  Shield,
  LayoutDashboard,
  LogOut,
  Zap,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";

interface TopNavProps {
  /** Show the full hero-style nav (used on Home). Default: false (compact sticky bar) */
  variant?: "hero" | "compact";
}

export function TopNav({ variant = "compact" }: TopNavProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => location === path;
  const loginUrl = getLoginUrl();

  const isAdmin = user?.role === "admin";
  const isAthlete = user?.role === "athlete";

  // ── Tab definitions based on auth state ──────────────────────────────────
  const getTabs = () => {
    if (user && isAdmin) {
      return [
        { href: "/coach-dashboard", label: "Dashboard", icon: LayoutDashboard, active: isActive("/coach-dashboard"), accent: false, external: false },
        { href: "/admin", label: "Admin", icon: Shield, active: isActive("/admin"), accent: true, external: false },
      ];
    }
    if (user && isAthlete) {
      return [
        { href: "/athlete-portal", label: "My Portal", icon: User, active: isActive("/athlete-portal"), accent: true, external: false },
      ];
    }
    // Not logged in
    return [
      { href: "/athlete-portal", label: "Athlete Portal", icon: User, active: isActive("/athlete-portal"), accent: true, external: false },
      { href: loginUrl, label: "Admin", icon: Shield, active: false, accent: false, external: true },
    ];
  };

  const tabs = getTabs();

  // ── Shared tab pill renderer ──────────────────────────────────────────────
  const renderTab = (tab: typeof tabs[0], size: "sm" | "xs" = "sm") => {
    const base = size === "xs"
      ? "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-electric/60 whitespace-nowrap"
      : "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-electric/60 whitespace-nowrap";

    const activeClass = tab.accent
      ? "bg-electric text-white shadow-md shadow-electric/30"
      : "bg-white/10 text-foreground border border-white/15";

    const inactiveClass = tab.accent
      ? "text-foreground/70 hover:text-foreground hover:bg-electric/15 border border-transparent hover:border-electric/30"
      : "text-foreground/60 hover:text-foreground hover:bg-white/8 border border-transparent hover:border-white/15";

    const cls = `${base} ${tab.active ? activeClass : inactiveClass}`;
    const Icon = tab.icon;

    if (tab.external) {
      return (
        <a key={tab.href} href={tab.href} className={cls}>
          <Icon className={size === "xs" ? "h-3.5 w-3.5 flex-shrink-0" : "h-4 w-4 flex-shrink-0"} />
          {tab.label}
        </a>
      );
    }

    return (
      <Link key={tab.href} href={tab.href}>
        <a className={cls}>
          <Icon className={size === "xs" ? "h-3.5 w-3.5 flex-shrink-0" : "h-4 w-4 flex-shrink-0"} />
          {tab.label}
        </a>
      </Link>
    );
  };

  const renderLogoutBtn = (size: "sm" | "xs" = "sm") => {
    if (!user) return null;
    const base = size === "xs"
      ? "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-foreground/50 hover:text-foreground hover:bg-white/8 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 whitespace-nowrap"
      : "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-foreground/50 hover:text-foreground hover:bg-white/8 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 whitespace-nowrap";
    return (
      <button onClick={logout} className={base}>
        <LogOut className={size === "xs" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        <span>Logout</span>
      </button>
    );
  };

  // ── Compact sticky nav (used on non-Home pages) ───────────────────────────
  if (variant === "compact") {
    return (
      <header className="sticky top-0 z-40 glass border-b border-white/10 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-12 sm:h-14 flex items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center gap-2 group flex-shrink-0">
              <div className="h-7 w-7 sm:h-8 sm:w-8 bg-gradient-to-br from-primary to-electric rounded-lg flex items-center justify-center font-heading font-bold text-xs sm:text-sm text-white shadow-md shadow-electric/20 group-hover:shadow-electric/40 transition-shadow">
                CS
              </div>
              <span className="font-heading font-bold text-xs sm:text-sm text-foreground hidden md:block group-hover:text-electric transition-colors">
                Coach Steve
              </span>
            </a>
          </Link>

          {/* Pinned tabs — always visible on all screen sizes */}
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
            {/* Mobile: xs size tabs */}
            <div className="flex sm:hidden items-center gap-1">
              {tabs.map(tab => renderTab(tab, "xs"))}
              {user && <NotificationBell />}
              {renderLogoutBtn("xs")}
            </div>
            {/* Desktop: sm size tabs */}
            <div className="hidden sm:flex items-center gap-2">
              {tabs.map(tab => renderTab(tab, "sm"))}
              {user && <NotificationBell />}
              {renderLogoutBtn("sm")}
            </div>
          </div>
        </div>
      </header>
    );
  }

  // ── Hero inline nav (used inside Home page header) ────────────────────────
  return (
    <nav className="flex justify-between items-center mb-6 md:mb-10 animate-fade-in-down relative">
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-primary to-electric rounded-lg flex items-center justify-center font-heading font-bold text-sm sm:text-lg text-white shadow-lg shadow-primary/20">
          CS
        </div>
        <span className="font-heading font-bold text-sm sm:text-lg text-foreground hidden sm:block">
          Coach Steve
        </span>
      </div>

      {/* Pinned tabs — always visible on all screen sizes */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Mobile: xs size tabs */}
        <div className="flex sm:hidden items-center gap-1">
          {tabs.map(tab => renderTab(tab, "xs"))}
          {user && <NotificationBell />}
          {renderLogoutBtn("xs")}
        </div>
        {/* Desktop: sm size tabs */}
        <div className="hidden sm:flex items-center gap-2">
          {tabs.map(tab => renderTab(tab, "sm"))}
          {user && <NotificationBell />}
          {renderLogoutBtn("sm")}
        </div>
      </div>
    </nav>
  );
}
