import { useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AthleteAssignmentOverview } from "@/components/AthleteAssignmentOverview";
import { CoachDashboardFAB } from "@/components/mobile/FloatingActionButton";
import { ScrollToTop } from "@/components/mobile/ScrollToTop";

export default function OverviewPage() {
  const [, navigate] = useLocation();

  return (
    <DashboardLayout title="Overview" subtitle="Athletes & assignments at a glance">
      <AthleteAssignmentOverview
        onSelectAthlete={(athleteId) => {
          navigate(`/coach-dashboard/assign?athlete=${encodeURIComponent(athleteId)}`);
        }}
      />

      {/* Mobile FAB for quick actions */}
      <CoachDashboardFAB
        onInvite={() => navigate("/coach-dashboard/athletes")}
        onAssignDrill={() => navigate("/coach-dashboard/assign")}
        onSessionNote={() => navigate("/coach-dashboard/session-notes")}
      />

      {/* Scroll to top */}
      <ScrollToTop bottomOffset={100} />
    </DashboardLayout>
  );
}
