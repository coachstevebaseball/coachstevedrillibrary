import { useState, type ReactNode } from "react";
import { Sidebar, type SidebarAction } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";
import { MobileTabBar } from "./MobileTabBar";

type DashboardLayoutProps = {
  title: string;
  subtitle?: string;
  onInvite?: () => void;
  onAddDrill?: () => void;
  children: ReactNode;
};

export function DashboardLayout({
  title,
  subtitle,
  onInvite,
  onAddDrill,
  children,
}: DashboardLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Sidebar action handler stub — Bulk Goals / Bulk Import modals
  // get wired into real components in a later commit.
  const handleSidebarAction = (action: SidebarAction) => {
    void action;
  };

  return (
    <div className="min-h-screen bg-[rgb(11,11,12)] text-white flex w-full max-w-full overflow-x-hidden">
      {/* Desktop sidebar (md and up) */}
      <div className="hidden md:block sticky top-0 self-start h-screen">
        <Sidebar onAction={handleSidebarAction} />
      </div>

      {/* Mobile drawer (< md) */}
      <MobileNav
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        onAction={handleSidebarAction}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setMobileNavOpen(true)}
          onInvite={onInvite}
          onAddDrill={onAddDrill}
        />
        <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6 pb-24 md:pb-6">{children}</main>
      </div>

      {/* Mobile bottom tab bar — hidden on md and up since the desktop sidebar is always visible. */}
      <MobileTabBar />
    </div>
  );
}
