import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  User,
  Shield,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopNavProps {
  /** Show the full hero-style nav (used on Home). Default: false (compact sticky bar) */
  variant?: "hero" | "compact";
}

export function TopNav({ variant = "compact" }: TopNavProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const loginUrl = getLoginUrl();

  // ── Logged-in states ─────────────────────────────────────────────────────
  const isAdmin = user?.role === "admin";
  const isAthlete = user?.role === "athlete" || user?.role === "user";

  // ── Nav link helper ───────────────────────────────────────────────────────
  const NavTab = ({
    href,
    label,
    icon: Icon,
    active,
    accent,
    external,
    onClick,
  }: {
    href: string;
    label: string;
    icon: React.ElementType;
    active?: boolean;
    accent?: boolean;
    external?: boolean;
    onClick?: () => void;
  }) => {
    const base =
      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-electric/60";

    const activeClass = accent
      ? "bg-electric text-white shadow-md shadow-electric/30"
      : "bg-white/10 text-foreground border border-white/15";

    const inactiveClass = accent
      ? "text-foreground/70 hover:text-foreground hover:bg-electric/15 border border-transparent hover:border-electric/30"
      : "text-foreground/60 hover:text-foreground hover:bg-white/8 border border-transparent hover:border-white/15";

    const cls = `${base} ${active ? activeClass : inactiveClass}`;

    if (external) {
      return (
        <a href={href} className={cls} onClick={onClick}>
          <Icon className="h-4 w-4 flex-shrink-0" />
          {label}
        </a>
      );
    }

    return (
      <Link href={href}>
        <a className={cls} onClick={onClick}>
          <Icon className="h-4 w-4 flex-shrink-0" />
          {label}
        </a>
      </Link>
    );
  };

  // ── Right-side actions ────────────────────────────────────────────────────
  const renderDesktopActions = () => {
    if (user && isAdmin) {
      return (
        <div className="flex items-center gap-2">
          <NavTab
            href="/coach-dashboard"
            label="Dashboard"
            icon={LayoutDashboard}
            active={isActive("/coach-dashboard")}
          />
          <NavTab
            href="/admin"
            label="Admin"
            icon={Shield}
            active={isActive("/admin")}
            accent
          />
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-foreground/50 hover:text-foreground hover:bg-white/8 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      );
    }

    if (user && isAthlete) {
      return (
        <div className="flex items-center gap-2">
          <NavTab
            href="/athlete-portal"
            label="My Portal"
            icon={User}
            active={isActive("/athlete-portal")}
            accent
          />
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-foreground/50 hover:text-foreground hover:bg-white/8 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      );
    }

    // Not logged in — show both login tabs
    return (
      <div className="flex items-center gap-2">
        <NavTab
          href="/athlete-portal"
          label="Athlete Portal"
          icon={User}
          active={isActive("/athlete-portal")}
          accent
        />
        <NavTab
          href={loginUrl}
          label="Admin"
          icon={Shield}
          active={false}
          external
        />
      </div>
    );
  };

  const renderMobileMenu = () => {
    if (!mobileOpen) return null;

    return (
      <div className="absolute top-full left-0 right-0 z-50 border-t border-white/10 shadow-xl animate-fade-in-down" style={{background: "oklch(0.18 0.052 267 / 0.97)", backdropFilter: "blur(20px)"}}>
        <div className="flex flex-col gap-1">
          {user && isAdmin && (
            <>
              <MobileLink
                href="/coach-dashboard"
                label="Dashboard"
                icon={LayoutDashboard}
                active={isActive("/coach-dashboard")}
                onClick={() => setMobileOpen(false)}
              />
              <MobileLink
                href="/admin"
                label="Admin Panel"
                icon={Shield}
                active={isActive("/admin")}
                accent
                onClick={() => setMobileOpen(false)}
              />
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all text-left"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          )}

          {user && isAthlete && (
            <>
              <MobileLink
                href="/athlete-portal"
                label="My Portal"
                icon={User}
                active={isActive("/athlete-portal")}
                accent
                onClick={() => setMobileOpen(false)}
              />
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all text-left"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          )}

          {!user && (
            <>
              <MobileLink
                href="/athlete-portal"
                label="Athlete Portal"
                icon={User}
                active={isActive("/athlete-portal")}
                accent
                onClick={() => setMobileOpen(false)}
              />
              <a
                href={loginUrl}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 border border-white/15 transition-all"
                onClick={() => setMobileOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4" />
                  Admin Login
                </div>
                <ChevronRight className="h-4 w-4 text-foreground/30" />
              </a>
            </>
          )}
        </div>
      </div>
    );
  };

  // ── Compact sticky nav (used on non-Home pages) ───────────────────────────
  if (variant === "compact") {
    return (
      <header className="sticky top-0 z-40 glass border-b border-white/10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 bg-gradient-to-br from-secondary to-electric rounded-lg flex items-center justify-center font-heading font-bold text-sm text-white shadow-md shadow-electric/20 group-hover:shadow-electric/40 transition-shadow">
                CS
              </div>
              <span className="font-heading font-bold text-sm text-foreground hidden sm:block group-hover:text-electric transition-colors">
                Coach Steve Baseball
              </span>
            </a>
          </Link>

          {/* Desktop tabs */}
          <div className="hidden sm:flex">{renderDesktopActions()}</div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg text-foreground/60 hover:text-foreground hover:bg-white/8 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-electric/50"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        <div className="relative sm:hidden">{renderMobileMenu()}</div>
      </header>
    );
  }

  // ── Hero inline nav (used inside Home page header) ────────────────────────
  return (
    <nav className="flex justify-between items-center mb-10 md:mb-16 animate-fade-in-down relative">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-gradient-to-br from-secondary to-electric rounded-lg flex items-center justify-center font-heading font-bold text-lg text-white shadow-lg shadow-secondary/20">
          CS
        </div>
        <span className="font-heading font-bold text-lg text-foreground hidden sm:block">
          Coach Steve
        </span>
      </div>

      {/* Desktop tabs */}
      <div className="hidden sm:flex items-center gap-2">
        {renderDesktopActions()}
      </div>

      {/* Mobile hamburger */}
      <button
        className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg text-foreground/60 hover:text-foreground hover:bg-white/8 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-electric/50"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile dropdown — fixed to viewport so it escapes overflow:hidden on hero */}
      {mobileOpen && (
        <div className="fixed top-16 right-3 w-64 z-[9999] rounded-xl border border-white/20 shadow-2xl p-2 flex flex-col gap-1 animate-fade-in-down sm:hidden" style={{background: "oklch(0.14 0.052 267 / 0.98)", backdropFilter: "blur(24px)"}}>
          {renderMobileMenu()}
        </div>
      )}
    </nav>
  );
}

// ── Helper: mobile link row ───────────────────────────────────────────────────
function MobileLink({
  href,
  label,
  icon: Icon,
  active,
  accent,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active?: boolean;
  accent?: boolean;
  onClick?: () => void;
}) {
  const base =
    "flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all";
  const activeClass = accent
    ? "bg-electric text-white"
    : "bg-white/10 text-foreground border border-white/15";
  const inactiveClass = accent
    ? "text-foreground/80 hover:bg-electric/15 hover:text-foreground border border-electric/20"
    : "text-foreground/70 hover:text-foreground hover:bg-white/8 border border-white/10";

  return (
    <Link href={href}>
      <a className={`${base} ${active ? activeClass : inactiveClass}`} onClick={onClick}>
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4" />
          {label}
        </div>
        <ChevronRight className="h-4 w-4 text-white/40" />
      </a>
    </Link>
  );
}
